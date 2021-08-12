import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import {
    Directive,
    DirectiveHookParams,
    DirectiveParams,
    DirectiveResultParams,
    RenderItem,
    RenderType
} from '../interface/normal.interface';
import { ergodicTree, genStrategyMapper, genUniqueId, waitImmediately, waitNextFrame } from '../utils/NormalUtils';

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
    directives?: Directive[]
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
    defineScope(dom, params) {
        // console.log(dom, params);
        return [
            new HtmlRenderer({ element: dom })
        ];
    }
};

export class HtmlRenderer {

    private renderingMapping: { [renderId: string]: RenderItem } = Object.create(null);

    private afterItemRenderedCallbackList: Array<(renderItem: RenderItem) => any> = [];
    private afterRenderedCallbackList: Array<() => any | void> = [];

    private beforeRenderedCallbackList: Array<() => any | void> = [];
    private renderIdDelayQueue: Array<string> = [];
    private renderDelayCallbackMapping: { [renderId: string]: () => any } = Object.create(null);
    private nextTicksCallbackList: Array<(v?: any) => any | void> = [];

    private element: Element;
    private _context: any = {};
    private directives: Directive[] = [];
    private options: any = {};
    private originElement: Element;
    private mountedElement: Element;

    constructor(options: RendererOption = {}) {
        const { element, context, directives } = this.options = {
            ...getDefaultOptions(),
            ...options
        };
        if (typeof element === 'string') {
            this.originElement = this.mountedElement = document.querySelector(element);
        } else {
            this.originElement = this.mountedElement = element;
        }
        this.element = this.originElement.cloneNode(true) as Element;
        this.context = context;
        this.directives = directives;
    }

    public renderAll() {
        ergodicTree(this.element)(
            (node, parent, preventDeeply) => {
                this.renderNode(node);
                if (this.childRendererMap.has(node)) {
                    preventDeeply();
                }
            }
        );
        return this.nextTick();
    }

    private childRendererMap = new Map<Node, HtmlRenderer>();

    public attachChildRenderer(node: Node, context: any = {}) {
        const parser = new HtmlRenderer({
            ...this.options,
            context: new Proxy(this.context, {
                get(target: any, p: string | symbol, receiver: any): any {
                    if (p in context) {
                        return context[p];
                    }
                    return Reflect.get(target, p, receiver);
                }
            })
        });
        parser.parentRenderer = this;
        this.childRendererMap.set(node, parser);
        return parser;
    }

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

    public tearChildParser(node) {
        const renderer = this.childRendererMap.get(node);
        if (renderer) {
            renderer.parentRenderer = undefined;
            this.childRendererMap.delete(node);
        }
    }


    public async mount(queryOrElement?: string | Element) {
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
        await this.renderAll();
    }

    public unmount() {
        if (this.mountedElement) {
            this.element.parentElement.replaceChild(this.mountedElement, this.element);
        }
    }

    public renderNode(node: Node): void {
        let renderItems: RenderItem[] | void = [];
        if (node.nodeType === Node.TEXT_NODE && node.parentNode.nodeType !== Node.COMMENT_NODE) {
            const item = this.renderText(node as Text);
            if (item) {
                renderItems.push(item);
            }
        } else if (node instanceof Element && node.nodeType === Node.ELEMENT_NODE) {
            renderItems = this.renderHtmlElement(node);
        }
        for (const item of renderItems || []) {
            this.registerRenderItem(item);
        }
    }

    private registerRenderItem(item: RenderItem) {
        this.renderingMapping[item.id] = item;
        if (this.parentRenderer) {
            this.parentRenderer.registerRenderItem({
                id: item.id,
                type: RenderType.CHILD_PARSER,
                renderer: this,
                target: item.target
            });
        } else {
            this.renderSingleItemDelay(item.id);
        }
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
                    const rendererList = directive.defineScope(ele, params) || [];
                    for (const renderer of rendererList) {
                        this.addChildRenderer(renderer);
                        renderer.mount();
                    }
                    return;
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

    public render() {

        if (!this.renderIdDelayQueue || this.renderIdDelayQueue.length === 0) {
            return this.element;
        }

        // call before hooks
        this.beforeRenderedCallbackList.forEach(
            callback => {
                callback.call(this);
            }
        );

        // render logic
        const renderCallbacks =
            this.renderIdDelayQueue
                .map(renderId => this.renderDelayCallbackMapping[renderId]);

        const promise = Promise.resolve()
            .then(() => Promise.all(
                renderCallbacks.map(
                    cb => waitNextFrame()
                        .then(() => cb.call(this))
                )
            ));

        this.renderIdDelayQueue = [];
        this.renderDelayCallbackMapping = {};

        return promise.then(() => {
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

            return this.element;
        });
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


    private renderDirective(ele: Element, directive: Directive, params: DirectiveParams, scopedRenderers?: HtmlRenderer[]) {
        const renderId = genUniqueId();
        const trans: any = {};
        const renderItem = {
            id: renderId,
            type: RenderType.DIRECTIVE,
            target: ele,
            renderer: directive,
            data: {
                params, trans, scopedRenderers
            }
        };
        const preventSub: boolean | Promise<boolean> = directive.created.call(this.context, ele);
        // todo - after render?
        return renderItem;
    }

    private renderSingleDirective(renderId: string) {
        const renderItem = this.renderingMapping[renderId] || {};
        const { id, type, renderer, data: { params = {}, trans = {}, scopedRenderers = [] } = {}, target } = renderItem as RenderItem || {};

        let { attribute = '', expression = '', key } = params;

        const resultParams: DirectiveResultParams = {
            attribute: attribute,
            key, result: undefined
        };

        if (/^\[]$/.test(attribute)) {
            const [, matchedAttribute] = [...attribute.matchAll(/\[(.+)]/g)];
            resultParams.attribute = execExpression(matchedAttribute, this.context);
        }

        resultParams.result = execExpression(expression, this.context);

        if (renderer) {
            renderer.render.call(this.context, { target, params: resultParams, trans, scopedRenderers });
            return true;
        }
        return false;
    }

    public renderSingleItemDelay(renderId: string): void {

        // if entered the queue, ignore it
        if (this.renderIdDelayQueue.includes(renderId)) {
            return;
        }

        // add rendering task for current renderId
        this.renderIdDelayQueue.push(renderId);
        this.renderDelayCallbackMapping[renderId] = () => this.renderSingleItem(renderId);

        // make render async
        // using waitImmediately to wait all changes in this moment
        waitImmediately(this)
            .then(() => this.render());

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
                this.emitAfterItemRendered(renderItem);
            }
        }
    }

    private renderChildParser(renderId: string): boolean {
        const renderItem = this.renderingMapping[renderId];
        const { renderer } = renderItem;
        if (renderer) {
            renderer.renderSingleItem(renderId);
            return true;
        }
        return false;
    }

    private emitAfterItemRendered(item: RenderItem) {
        this.afterItemRenderedCallbackList.forEach(
            callback => {
                callback.call(this, item);
            }
        );
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

    afterItemRendered(callback: (item: RenderItem) => any) {
        if (typeof callback === 'function') {
            this.afterItemRenderedCallbackList.push(callback);
        }
    }

}