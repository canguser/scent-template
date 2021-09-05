import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import {
    Directive,
    DirectiveDetails,
    DirectiveDetailsResult,
    DirectiveHookParams,
    DirectiveResultParams,
    RenderItem,
    RenderType,
    ScopeTemplate
} from '../interface/normal.interface';
import * as PresetDirectives from '../directives/PresetDirectives';
import { ergodicTree, genStrategyMapper, genUniqueId, waitImmediately, waitNextFrame } from '../utils/NormalUtils';
import { isTemplate, removeAttribute, replaceCommonNode, replaceNode, unmountDom } from '../utils/DomHelper';
import { HooksInstance } from '../utils/HooksUtils';

type RenderSingleText = (textNode: Text) => void

export interface RendererOption {
    element?: Element | string,
    context?: any,
    directives?: Directive[],
    mount?: Node,
    elements?: Element[] | string
}

function getDefaultOptions() {
    return {
        context: {},
        directives: []
    };
}

const defaultDirective: Directive = {
    afterMounted() {
    },
    name: '',
    created() {
    },
    destroyed() {
    },
    beforeRendered() {
    },
    afterRendered() {
    },
    render(params: DirectiveHookParams): void {
    },
    defineScopes(params) {
    },
    defineTemplates(template: ScopeTemplate, params: DirectiveResultParams): { [p: string]: HtmlRenderer } {
        return {
            ...template.from(0)
        };
    }
};

export enum RendererHooks {
    BeforeContextUsed = 'BeforeContextUsed',
    AfterContextUsed = 'AfterContextUsed',
    AfterRendered = 'AfterRendered',
    BeforeRendered = 'BeforeRendered',
    BeforeMounted = 'BeforeMounted',
    AfterMounted = 'AfterMounted',
    BeforeUnmounted = 'BeforeUnmounted',
    AfterUnmounted = 'AfterUnmounted',
    BeforeDestroyed = 'BeforeDestroyed',
    AfterDestroyed = 'AfterDestroyed',
}

export class HtmlRenderer extends HooksInstance {

    private renderingMapping: { [renderId: string]: RenderItem } = Object.create(null);

    private renderIdDelayQueue: Array<string> = [];
    private renderDelayCallbackMapping: { [renderId: string]: () => any } = Object.create(null);

    private renderIdSyncQueue: Array<string> = [];
    private renderSyncCallbackMapping: { [renderId: string]: () => any } = Object.create(null);

    private _context: any = {};
    private directives: Directive[] = [];
    private options: any = {};
    private scopedNodes = [];

    private element: Element; // data result element
    private templateElement: Element; // template element
    private toOccupiedElement: Element; // to mounted element
    private mountedElements: Element[]; // current mounted element

    private hasBeginRendering: boolean = false;

    constructor(options: RendererOption = {}) {
        super();
        let { element, context, directives, mount } = this.options = {
            ...getDefaultOptions(),
            ...options
        };
        if (typeof element === 'string') {
            this.templateElement = this.toOccupiedElement = document.querySelector(element);
        } else {
            this.templateElement = this.toOccupiedElement = element;
        }
        this.element = this.templateElement.cloneNode(true) as Element;
        if (typeof mount === 'string') {
            mount = document.querySelector(mount);
        }
        if (mount) {
            this.toOccupiedElement = mount as Element;
        }
        this.context = context;
        this.directives = [...Object.values(PresetDirectives), ...directives];
    }

    public renderAll(force = false) {
        if (force && this.hasBeginRendering) {
            Object.keys(this.renderingMapping).forEach((renderId) => {
                this.discardRenderId(renderId);
            });
            this.element = this.templateElement.cloneNode(true) as Element;
            this.hasBeginRendering = false;
        }
        if (!this.hasBeginRendering) {
            this.hasBeginRendering = true;
            this.scopedNodes = [];
            ergodicTree(this.element)(
                (node, parent, preventDeeply, extraNodes) => {
                    this.renderNode(node);
                    if (this.scopedNodes.includes(node)) {
                        preventDeeply();
                    }
                    if (isTemplate(node)) {
                        const contentNode = node['content'];
                        extraNodes(...[...contentNode.childNodes]);
                        replaceNode(node, contentNode);
                    }
                }
            );
            const result = this.render();
            if (!(result instanceof Promise)) {
                return Promise.resolve(result);
            }
        } else {
            for (const renderId of Object.keys(this.renderingMapping)) {
                this.renderSingleItemDelay(renderId);
            }
        }
        return this.nextTick();
    }

    private childRendererMap = new Map<Node, HtmlRenderer>();

    public addChildRenderer(renderer: HtmlRenderer): void {
        renderer.parentRenderer = this;
        this.childRendererMap.set(renderer.element, renderer);
    }

    public set context(v) {
        this._context = v;
    }

    public get context() {
        return new Proxy(this._context, {
            has: (target, p) => {
                if (!(p in target) && this.parentRenderer) {
                    return Reflect.has(this.parentRenderer.context, p);
                }
                return Reflect.has(target, p);
            },
            get: (target: any, p: string | symbol, receiver: any): any => {
                if (!(p in target) && this.parentRenderer) {
                    return this.parentRenderer.context[p];
                }
                return Reflect.get(target, p, receiver);
            }
        });
    }

    private parentRenderer: HtmlRenderer;

    public tearChildParser(renderer: HtmlRenderer) {
        if (renderer && renderer.parentRenderer === this) {
            const node = renderer.element;
            renderer.parentRenderer = undefined;
            this.childRendererMap.delete(node);
        }
    }

    public getRenderItem(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        if (renderItem && renderItem.type === RenderType.CHILD_PARSER) {
            return renderItem.renderer.getRenderItem(renderId);
        }
        return renderItem;
    }


    public mount(queryOrElement?: string | Element) {
        let ele;
        if (queryOrElement) {
            if (typeof queryOrElement === 'string') {
                ele = document.querySelector(queryOrElement);
            } else {
                ele = queryOrElement;
            }
        }
        if (ele && ele !== this.element) {
            this.toOccupiedElement = ele;
        }
        if (!this.toOccupiedElement.parentNode) {
            return;
        }
        this.dispatchHooks(RendererHooks.BeforeMounted);
        let element = this.element;
        if (isTemplate(this.element)) {
            element = this.element['content'];
        }
        this.mountedElements = replaceNode(this.toOccupiedElement, element);
        this.dispatchHooks(RendererHooks.AfterMounted);
    }

    public unmount(all = false) {
        this.dispatchHooks(RendererHooks.BeforeUnmounted);
        if (isTemplate(this.element)) {
            const parent = this.mountedElements?.[0]?.parentNode;
            const mountedElements = [...this.mountedElements || []];
            if (parent) {
                this.mountedElements = replaceNode(this.mountedElements, this.toOccupiedElement);
            }
            this.element['content'].append(...mountedElements);
        } else if (this.toOccupiedElement && this.mountedElements?.[0]?.parentNode) {
            this.mountedElements = replaceNode(this.mountedElements, this.toOccupiedElement);
        }
        if (all) {
            unmountDom(this.element);
            unmountDom(this.mountedElements);
            unmountDom(this.toOccupiedElement);
        }
        this.dispatchHooks(RendererHooks.AfterUnmounted);
    }

    public destroySelf() {
        this.dispatchHooks(RendererHooks.BeforeDestroyed);
        for (const renderer of this.childRendererMap.values()) {
            renderer.destroySelf();
        }
        this.unmount(true);
        Object.keys(this.renderingMapping).forEach(renderId => {
            this.discardRenderId(renderId);
        });
        this.hasBeginRendering = false;
        if (this.parentRenderer) {
            this.parentRenderer.tearChildParser(this);
        }
        this.dispatchHooks(RendererHooks.AfterDestroyed);
    }

    public renderNode(node: Node) {
        const renderItems = this.generateRenderItems(node);
        const { isMounted } = this;
        for (const item of renderItems || []) {
            this.registerRenderItem(item, isMounted);
        }
    }

    private generateRenderItems(node): RenderItem[] {
        let renderItems: RenderItem[] | void = [];
        if (node.nodeType === Node.TEXT_NODE && node.parentNode.nodeType !== Node.COMMENT_NODE) {
            const item = this.renderText(node as Text);
            if (item) {
                renderItems.push(item);
            }
        } else if (node instanceof Element && node.nodeType === Node.ELEMENT_NODE) {
            renderItems = this.renderHtmlElement(node);
        }
        if (!renderItems) {
            return [];
        }
        return renderItems.filter(item => item);
    }


    private registerRenderItem(item: RenderItem, isAsync = false) {
        this.renderingMapping[item.id] = item;
        if (this.parentRenderer) {
            return this.parentRenderer.registerRenderItem({
                id: item.id,
                type: RenderType.CHILD_PARSER,
                renderer: this,
                target: item.target
            }, isAsync);
        }

        if (isAsync) {
            this.renderSingleItemDelay(item.id);
        } else {
            this.renderSingleItemSync(item.id);
        }
    }

    private renderSingleItemSync(renderId) {
        if (renderId in this.renderingMapping) {
            this.emitBeforeItemRenders(renderId);
            this.addRenderSyncQueue(renderId);
        }
    }

    public nextTick(callback?: () => void) {
        return new Promise<any>(resolve => {
            this.registerHooks(RendererHooks.AfterRendered, callback, { once: true });
            this.registerHooks(RendererHooks.AfterRendered, resolve, { once: true });
        });
    }

    public renderHtmlElement(ele: Element): RenderItem[] | void {
        const names = ele.getAttributeNames();
        const directiveNames = names.filter(name => name.startsWith('c-'));
        const directiveInfos = [];
        for (const directiveName of directiveNames) {
            const [realName, attribute] = directiveName.split(':');
            const directive = this.getMatchedDirective(realName.replace(/^c-/, ''));
            if (directive) {
                const details: DirectiveDetails = {
                    key: realName,
                    attribute,
                    expression: ele.getAttribute(directiveName),
                    getDynamicResult: () => this.getDirectiveResultParams(details)
                };

                const params: DirectiveHookParams = {
                    trans: {},
                    target: ele,
                    details
                };

                if (directive.isScoped && ele !== this.element) {
                    // inner scoped
                    this.scopedNodes.push(ele);
                    const commentNode = replaceCommonNode(ele, 'scoped');
                    // prevent scoped node going next
                    const targetRenderer = new HtmlRenderer({ element: ele, mount: commentNode as Node });
                    this.addChildRenderer(targetRenderer);
                    targetRenderer.renderAll();
                    return;
                } else if (directive.isScoped) {
                    if (!this.parentRenderer) {
                        throw new Error('Can\'t using scoped directives in root element');
                    }
                    // host scoped
                    this.scopedNodes.push(ele);
                    let preventRender = false;
                    directive.created(this.context, params, () => preventRender = true);
                    return [this.renderDirective(ele, directive, params)];
                }
                let preventRender = false;
                directive.created(this.context, params, () => preventRender = true);
                directiveInfos.push({
                    directive,
                    params
                });
            }
        }
        return directiveInfos.map(({ directive, params }) => this.renderDirective(ele, directive, params));
    }

    private getMatchedDirective(uniqueName: string): Directive {
        let target = this.directives.find(
            d => d.name === uniqueName
        );
        if (!target && this.parentRenderer) {
            target = this.parentRenderer.getMatchedDirective(uniqueName);
        }
        if (target) {
            return {
                ...defaultDirective,
                ...target
            };
        }
    }

    private get hasDelayRenders() {
        return this.renderIdDelayQueue && this.renderIdDelayQueue.length > 0;
    }

    private get hasSyncRenders() {
        return this.renderIdSyncQueue && this.renderIdSyncQueue.length > 0;
    }

    public render(): void | Promise<void> {
        if (this.hasDelayRenders) {
            // call before hooks
            this.dispatchHooks(RendererHooks.BeforeRendered);

            if (this.hasSyncRenders) {
                this.emitSyncRendersQueue();
            }

            return this.emitDelayRendersQueue()
                .then(() => {
                    this.emitAfterRendered();
                });
        } else if (this.hasSyncRenders) {
            this.emitSyncRendersQueue();
            this.emitAfterRendered();
        }
    }

    emitSyncRendersQueue() {
        const renderCallbacks = this.renderIdSyncQueue.map(renderId => {
            // this.emitBeforeItemRenders(renderId);
            return this.renderSyncCallbackMapping[renderId] || (() => null);
        });

        renderCallbacks.forEach(cb => {
            cb.call(this);
        });
        this.renderIdSyncQueue = [];
        this.renderSyncCallbackMapping = {};
    }

    private emitDelayRendersQueue() {

        // render logic
        const renderCallbacks =
            this.renderIdDelayQueue
                .map(renderId => this.renderDelayCallbackMapping[renderId]);

        // const backupRenderIds = [...this.renderIdDelayQueue];
        //
        // backupRenderIds.forEach(renderId => {
        //     this.emitBeforeItemRenders(renderId);
        // });

        const promise = Promise.resolve()
            .then(() => Promise.all(
                renderCallbacks.map(
                    cb => waitNextFrame()
                        .then(() => cb.call(this))
                )
            ));

        this.renderIdDelayQueue = [];
        this.renderDelayCallbackMapping = {};

        return promise;
    }

    emitAfterRendered() {
        // call after hooks
        this.dispatchHooks(RendererHooks.AfterRendered);
    }

    emitBeforeRendered() {
        // call after hooks
        this.dispatchHooks(RendererHooks.BeforeRendered);
    }

    afterRendered(callback: () => any | void) {
        this.registerHooks(RendererHooks.AfterRendered, callback);
    }

    beforeMounted(callback: () => any | void) {
        this.registerHooks(RendererHooks.BeforeMounted, callback);
    }

    afterMounted(callback: () => any | void) {
        this.registerHooks(RendererHooks.AfterMounted, callback);
    }

    beforeUnmounted(callback: () => any | void) {
        this.registerHooks(RendererHooks.BeforeUnmounted, callback);
    }

    afterUnmounted(callback: () => any | void) {
        this.registerHooks(RendererHooks.AfterUnmounted, callback);
    }

    beforeDestroyed(callback: () => any | void) {
        this.registerHooks(RendererHooks.BeforeDestroyed, callback);
    }

    afterDestroyed(callback: () => any | void) {
        this.registerHooks(RendererHooks.AfterDestroyed, callback);
    }

    private renderText(textNode: Text): RenderItem | void {
        const { textContent } = textNode || {};
        const data = getBindingExpressions(textContent || '');
        const { expressions } = data;
        if (expressions.length > 0) {
            const renderId = genUniqueId();
            return {
                id: renderId,
                type: RenderType.TEXT,
                target: textNode,
                data
            };
        }
    }

    get isMounted() {
        return !!this.element.parentNode;
    }


    private renderDirective(ele: Element, directive: Directive, params: DirectiveHookParams) {
        const renderId = genUniqueId();
        return {
            id: renderId,
            type: RenderType.DIRECTIVE,
            target: ele,
            renderer: this,
            directive,
            data: {
                ...params,
                details: {
                    ...params.details,
                    getDynamicResult: () => {
                        return this.useContext(payload => {
                            payload(renderId);
                            return this.getDirectiveResultParams(params.details);
                        });
                    }
                }
            }
        };
    }

    private getDirectiveResultParams(params: DirectiveDetails) {
        let { attribute = '', expression = '' } = params;

        const resultParams: DirectiveDetailsResult = {
            key: params.key,
            attributeValue: attribute, result: undefined
        };

        if (/^\[]$/.test(attribute)) {
            const [, matchedAttribute] = [...attribute.matchAll(/\[(.+)]/g)][0];
            resultParams.attributeValue = execExpression(matchedAttribute, this.context);
        }

        resultParams.result = execExpression(expression, this.context);
        return resultParams;
    }

    private renderSingleDirective(renderId: string) {
        const renderItem = this.renderingMapping[renderId] || {};
        const { id, type, directive, data: { details = {}, trans = {} } = {}, target } = renderItem as RenderItem || {};
        directive.render.call(this.context, { target, details, trans });
    }

    private addRenderSyncQueue(renderId) {

        const index = this.renderIdSyncQueue.indexOf(renderId);
        if (index >= 0) {
            // if entered the queue, make it last
            this.renderIdSyncQueue.splice(index, 1);
        }

        // add rendering task for current renderId
        this.renderIdSyncQueue.push(renderId);

        this.renderSyncCallbackMapping[renderId] = () => this.renderSingleItem(renderId);

    }

    private addRenderDelayQueue(renderId) {
        const index = this.renderIdDelayQueue.indexOf(renderId);
        if (index >= 0) {
            // if entered the queue, make it last
            this.renderIdDelayQueue.splice(index, 1);
        }

        // add rendering task for current renderId
        this.renderIdDelayQueue.push(renderId);

        this.renderDelayCallbackMapping[renderId] = () => this.renderSingleItem(renderId);
    }

    public renderSingleItemDelay(renderId: string): void {

        if (renderId in this.renderingMapping) {
            this.addRenderDelayQueue(renderId);
            this.emitBeforeItemRenders(renderId);
            // make render async
            // using waitImmediately to wait all changes in this moment
            waitImmediately(this)
                .then(() => this.render());
        }

    }


    private emitBeforeItemRenders(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        if (renderItem) {
            const mapper = genStrategyMapper({
                [RenderType.TEXT]: () => this.beforeRenderSingleText(renderId),
                [RenderType.DIRECTIVE]: () => this.beforeRenderSingleDirective(renderId),
                [RenderType.CHILD_PARSER]: () => this.beforeRenderSingleChildParser(renderId)
            }, () => undefined);
            mapper[renderItem.type]();
        }
    }

    private beforeRenderSingleText(renderId: string) {
    }

    private beforeRenderSingleDirective(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        const { directive, target, data: { details, templatesMap = {}, mountedKeys = [] } } = renderItem;
        removeAttribute(target, details.key);
        if (directive.isScoped) {
            renderItem.data.templatesMap = templatesMap;
            renderItem.data.mountedKeys = mountedKeys;
            const [scopes, templates] = this.useContext(payload => {
                payload(renderId);
                return [
                    directive.defineScopes(details),
                    directive.defineTemplates({
                        from: (key: any, context: any = {}) => {
                            if (key in templatesMap) {
                                return {
                                    [key]: templatesMap[key]
                                };
                            }
                            const template = new HtmlRenderer({
                                element: target,
                                mount: document.createComment('scopeItem'),
                                context
                            });
                            templatesMap[key] = template;
                            return {
                                [key]: template
                            };
                        }
                    }, details)
                ];
            });

            const keys = Object.keys(templates);

            for (const mountedKey of mountedKeys) {
                if (!keys.includes(mountedKey)) {
                    console.log(mountedKey, 'destroyed');
                    templatesMap[mountedKey].destroySelf();
                    delete templatesMap[mountedKey];
                }
            }

            renderItem.data.mountedKeys = keys;

            for (const [key, t] of Object.entries(templates)) {
                if (!mountedKeys.includes(key)) {
                    this.addChildRenderer(t);
                    const mountDOM = t.toOccupiedElement;
                    this.toOccupiedElement.parentNode.insertBefore(mountDOM, this.toOccupiedElement);
                    t.renderAll(true)
                        .then(() => {
                            setTimeout(() => {
                                t.mount();
                            }, 0);
                        });
                } else {
                    // console.log('???');
                    // console.log(key, 'refresh');
                    t.renderAll();
                }
            }
        }
        directive.beforeRendered(target);
    }

    private beforeRenderSingleChildParser(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        const { renderer } = renderItem;
        if (renderer && renderer.parentRenderer === this) {
            renderer.emitBeforeItemRenders(renderId);
        } else {
            this.discardRenderId(renderId);
        }
    }

    private renderSingleItem(renderId: string) {
        if (renderId in this.renderingMapping) {
            const renderItem = this.renderingMapping[renderId];
            const { type } = renderItem || {};
            const mapper = genStrategyMapper({
                [RenderType.TEXT]: () => this.renderSingleText(renderId),
                [RenderType.DIRECTIVE]: () => this.renderSingleDirective(renderId),
                [RenderType.CHILD_PARSER]: () => this.renderChildParser(renderId)
            }, () => undefined);
            if (mapper[type]()) {
                this.emitContextUsed(renderItem.id);
            }
        }
    }

    private renderChildParser(renderId: string): boolean {
        const renderItem = this.renderingMapping[renderId];
        const { renderer } = renderItem;
        if (renderer && renderer.parentRenderer === this) {
            renderer.renderSingleItem(renderId);
            return true;
        }
        this.discardRenderId(renderId);
        return false;
    }

    private emitBeforeContextUsed() {
        if (this.parentRenderer) {
            this.parentRenderer.emitBeforeContextUsed();
        } else {
            this.dispatchHooks(RendererHooks.BeforeContextUsed);
        }
    }

    private emitContextUsed(renderId: string) {
        if (this.parentRenderer) {
            this.parentRenderer.emitContextUsed(renderId);
        } else {
            this.dispatchHooks(RendererHooks.AfterContextUsed, renderId);
        }
    }

    private useContext<T>(callback: (payload?: Function) => T, withoutNotification = false): T {
        if (typeof callback === 'function') {
            if (withoutNotification) {
                return callback.call(this, () => undefined);
            }
            this.emitBeforeContextUsed();
            let payload;
            const result = callback.call(this, p => {
                payload = p;
            });
            this.emitContextUsed(payload);
            return result;
        }
    };

    private renderSingleText(renderId: string) {
        if (renderId in this.renderingMapping && this.renderingMapping[renderId].type === RenderType.TEXT) {
            const renderItem = this.renderingMapping[renderId];
            const { data, target } = renderItem || {};
            if (target) {
                const { raw, expressions } = data || {};
                const copyRaw = [...raw];
                this.useContext(
                    payload => {
                        expressions.forEach((expression, i) => {
                            copyRaw.splice(i + 1, 0, execExpression(expression, this.context));
                        });
                        payload(renderId);
                    }
                );
                target.textContent = copyRaw.join('');
            }
        }
    }

    private discardSingleDirective(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        if (renderItem && renderItem.type === RenderType.DIRECTIVE) {
            const { target, data: { details, trans } } = renderItem;
            renderItem.directive.destroyed({ target, details, trans });
        }
    }

    private discardRenderId(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        if (renderItem) {
            if (renderItem.type === RenderType.DIRECTIVE) {
                this.discardSingleDirective(renderId);
            }
            delete this.renderingMapping[renderId];
            // notified parent
            if (this.parentRenderer) {
                this.parentRenderer.discardRenderId(renderId);
            }
            // notified child
            if (renderItem.type === RenderType.CHILD_PARSER && renderItem.renderer.parentRenderer === this) {
                renderItem.renderer.discardRenderId(renderId);
            }
        }
    }

    afterContextUsed(callback: (renderId: string) => any) {
        this.registerHooks(RendererHooks.AfterContextUsed, callback);
    }

    beforeContextUsed(callback: (renderId: string) => any) {
        this.registerHooks(RendererHooks.BeforeContextUsed, callback);
    }

}