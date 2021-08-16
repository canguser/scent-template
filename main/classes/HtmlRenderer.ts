import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import {
    Directive,
    DirectiveHookParams,
    DirectiveParams,
    DirectiveResultParams,
    RenderItem,
    RenderType,
    ScopeTemplate
} from '../interface/normal.interface';
import { ergodicTree, genStrategyMapper, genUniqueId, waitImmediately, waitNextFrame } from '../utils/NormalUtils';
import { removeAttribute, replaceCommonNode, unmountDom } from '../utils/DomHelper';

type RenderSingleText = (textNode: Text) => void

type RenderDelayCallback = (
    {
        renderSingleText
    }: {
        renderSingleText: RenderSingleText
    }) => void

export interface RendererOption {
    element?: Element | string,
    context?: any,
    directives?: Directive[],
    mount?: Node
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
    beforeRendered() {
    },
    afterRendered() {
    },
    render(params: DirectiveHookParams): void {
    },
    defineScopes(params) {
        // console.log(dom, params);
    },
    defineTemplates(template: ScopeTemplate, params: DirectiveResultParams): { [p: string]: HtmlRenderer } {
        return {
            ...template.from(0)
        };
    }
};

export class HtmlRenderer {

    private renderingMapping: { [renderId: string]: RenderItem } = Object.create(null);

    private afterContextUsedCallbackList: Array<(renderId: string) => any> = [];
    private afterRenderedCallbackList: Array<() => any | void> = [];

    private beforeRenderedCallbackList: Array<() => any | void> = [];

    private renderIdDelayQueue: Array<string> = [];
    private renderDelayCallbackMapping: { [renderId: string]: () => any } = Object.create(null);

    private renderIdSyncQueue: Array<string> = [];
    private renderSyncCallbackMapping: { [renderId: string]: () => any } = Object.create(null);

    private nextTicksCallbackList: Array<(v?: any) => any | void> = [];

    private _context: any = {};
    private directives: Directive[] = [];
    private options: any = {};
    private scopedNodes = [];

    private element: Element; // data result element
    private originElement: Element; // template element
    private mountedElement: Element; // mounted element

    private hasBeginRendering: boolean = false;

    constructor(options: RendererOption = {}) {
        const { element, context, directives, mount } = this.options = {
            ...getDefaultOptions(),
            ...options
        };
        if (typeof element === 'string') {
            this.originElement = this.mountedElement = document.querySelector(element);
        } else {
            this.originElement = this.mountedElement = element;
        }
        this.element = this.originElement.cloneNode(true) as Element;
        if (mount) {
            this.mountedElement = mount as Element;
        }
        this.context = context;
        this.directives = directives;
    }

    public renderAll(force = false) {
        if (force && this.hasBeginRendering) {
            Object.keys(this.renderingMapping).forEach((renderId) => {
                this.discardRenderId(renderId);
            });
            this.element = this.originElement.cloneNode(true) as Element;
            this.hasBeginRendering = false;
        }
        if (!this.hasBeginRendering) {
            this.hasBeginRendering = true;
            this.scopedNodes = [];
            ergodicTree(this.element)(
                (node, parent, preventDeeply) => {
                    this.renderNode(node);
                    if (this.scopedNodes.includes(node)) {
                        preventDeeply();
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
            this.mountedElement = ele;
        }
        if (!this.mountedElement.parentElement) {
            return;
        }
        this.mountedElement.parentElement.replaceChild(this.element, this.mountedElement);
    }

    public unmount(all = false) {
        if (all) {
            unmountDom(this.mountedElement);
            unmountDom(this.element);
        } else if (this.mountedElement && this.element.parentElement) {
            this.element.parentElement.replaceChild(this.mountedElement, this.element);
        }
    }

    public destroySelf() {
        this.unmount(true);
        Object.keys(this.renderingMapping).forEach(renderId => {
            this.discardRenderId(renderId);
        });
        this.hasBeginRendering = false;
        if (this.parentRenderer) {
            this.parentRenderer.tearChildParser(this);
        }
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
        this.emitBeforeItemRenders(renderId);
        this.addRenderSyncQueue(renderId);
    }

    public nextTick(callback?: () => void) {
        return new Promise<any>(resolve => {
            this.nextTicksCallbackList.push(callback, resolve);
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
                const params = {
                    key: realName,
                    attribute,
                    expression: ele.getAttribute(directiveName)
                };
                if (directive.isScoped && ele !== this.element) {
                    this.scopedNodes.push(ele);
                    const commentNode = replaceCommonNode(ele, 'scoped');
                    // prevent scoped node going next
                    const targetRenderer = new HtmlRenderer({ element: ele, mount: commentNode as Node });
                    this.addChildRenderer(targetRenderer);
                    targetRenderer.renderAll();
                    return;
                } else if (directive.isScoped) {
                    this.scopedNodes.push(ele);
                    return [this.renderDirective(ele, directive, params)];
                }
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
            this.beforeRenderedCallbackList.forEach(
                callback => {
                    callback.call(this);
                }
            );

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
        this.afterRenderedCallbackList.forEach(
            callback => {
                callback.call(this);
            }
        );

        // call next tick
        this.nextTicksCallbackList.forEach(
            callback => {
                if (typeof callback === 'function') {
                    callback.call(this);
                }
            }
        );

        this.nextTicksCallbackList = [];
    }

    beforeRendered(callback: () => any | void) {
        if (typeof callback === 'function') {
            this.beforeRenderedCallbackList.push(callback);
        }
    }

    afterRendered(callback: () => any | void) {
        if (typeof callback === 'function') {
            this.afterRenderedCallbackList.push(callback);
        }
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
        return !!this.element.parentElement;
    }


    private renderDirective(ele: Element, directive: Directive, params: DirectiveParams) {
        const renderId = genUniqueId();
        const trans: any = {};
        const renderItem = {
            id: renderId,
            type: RenderType.DIRECTIVE,
            target: ele,
            renderer: this,
            directive,
            data: {
                params, trans
            }
        };
        // const preventSub: boolean | Promise<boolean> = directive.created.call(this.context, ele);
        // todo - after render?
        return renderItem;
    }

    private getDirectiveResultParams(params: DirectiveParams) {
        let { attribute = '', expression = '' } = params;

        const resultParams: DirectiveResultParams = {
            ...params,
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
        const { id, type, directive, data: { params = {}, trans = {} } = {}, target } = renderItem as RenderItem || {};
        directive.render.call(this.context, { target, params, trans });
        return true;
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

        this.addRenderDelayQueue(renderId);
        this.emitBeforeItemRenders(renderId);
        // make render async
        // using waitImmediately to wait all changes in this moment
        waitImmediately(this)
            .then(() => this.render());

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
        const { directive, target, data: { params, trans, templatesMap = {}, mountedKeys = [] } } = renderItem;
        const resultParams = this.getDirectiveResultParams(params);
        this.emitContextUsed(renderId);
        renderItem.data.params = resultParams;
        if (directive.isScoped) {
            renderItem.data.templatesMap = templatesMap;
            renderItem.data.mountedKeys = mountedKeys;
            removeAttribute(target, params.key);
            const scopes = directive.defineScopes(resultParams);
            const templates = directive.defineTemplates({
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
            }, resultParams);
            this.emitContextUsed(renderId);

            // console.log(Object.keys(templates).length);

            const keys = Object.keys(templates);

            for (const mountedKey of mountedKeys) {
                if (!keys.includes(mountedKey)) {
                    // console.log(mountedKey, 'destroyed');
                    templatesMap[mountedKey].destroySelf();
                    delete templatesMap[mountedKey];
                }
            }

            renderItem.data.mountedKeys = keys;

            for (const [key, t] of Object.entries(templates)) {
                if (!mountedKeys.includes(key)) {
                    // console.log(key, 'init');
                    this.addChildRenderer(t);
                    const mountDOM = t.mountedElement;
                    this.mountedElement.parentElement.insertBefore(mountDOM, this.mountedElement);
                    // t.mount();
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

    private emitContextUsed(renderId: string) {
        if (this.parentRenderer) {
            this.parentRenderer.emitContextUsed(renderId);
        } else {
            this.afterContextUsedCallbackList.forEach(
                callback => {
                    callback.call(this, renderId);
                }
            );
        }
    }

    private renderSingleText(renderId: string): boolean {
        if (renderId in this.renderingMapping && this.renderingMapping[renderId].type === RenderType.TEXT) {
            const renderItem = this.renderingMapping[renderId];
            const { data, target } = renderItem || {};
            if (target) {
                const { raw, expressions } = data || {};
                const copyRaw = [...raw];
                expressions.forEach((expression, i) => {
                    copyRaw.splice(i + 1, 0, execExpression(expression, this.context));
                });
                target.textContent = copyRaw.join('');
            }
            return true;
        }
        return false;
    }

    private discardRenderId(renderId: string) {
        const renderItem = this.renderingMapping[renderId];
        if (renderItem) {
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
        if (typeof callback === 'function') {
            this.afterContextUsedCallbackList.push(callback);
        }
    }

}