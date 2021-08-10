import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import { Directive, DirectiveHookParams, DirectiveParams, RenderItem, RenderType } from '../interface/normal.interface';
import {
    compatiblePromise,
    ergodicTree,
    genStrategyMapper,
    genUniqueId, ref,
    waitImmediately,
    waitNextFrame
} from '../utils/NormalUtils';
import { getAllNodes, inDocument } from '../utils/DomHelper';

type RenderSingleText = (textNode: Text) => void

type RenderDelayCallback = (
    {
        renderSingleText
    }: {
        renderSingleText: RenderSingleText
    }) => void

export interface RendererOption {
    element?: Element,
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
    }
};

export class HtmlRenderer {

    private renderingMapping: { [renderId: string]: RenderItem } = Object.create(null);

    private allNodes: Node[] = [];
    private directives: Directive[] = [];

    private afterItemRenderedCallbackList: Array<(renderItem: RenderItem) => any> = [];
    private afterRenderedCallbackList: Array<() => any | void> = [];

    private beforeRenderedCallbackList: Array<() => any | void> = [];
    private renderIdDelayQueue: Array<string> = [];
    private renderDelayCallbackMapping: { [renderId: string]: () => any } = Object.create(null);
    private nextTicksCallbackList: Array<(v?: any) => any | void> = [];

    private element: Element;
    private context: any;
    private options: any = {};

    constructor(options: RendererOption = {}) {
        const { element, context, directives } = this.options = {
            ...getDefaultOptions(),
            ...options
        };
        this.element = element;
        this.context = context;
        this.directives = directives;
    }

    public renderAll() {
        console.time('rendering to being ready');
        ergodicTree(this.element)(
            (node, parent, preventDeeply) => {
                this.renderNode(node);
                if (this.childRendererMap.has(node)) {
                    preventDeeply();
                }
            }
        );
        console.timeEnd('rendering to being ready');
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

    private parentRenderer: HtmlRenderer;

    public tearChildParser(node) {
        const renderer = this.childRendererMap.get(node);
        if (renderer) {
            renderer.parentRenderer = undefined;
            this.childRendererMap.delete(node);
        }
    }

    public mount(query) {
        const ele = document.querySelector(query);
        ele.parentElement.replaceChild(this.element, ele);
        this.renderAll();
    }

    public unmount() {
        this.element.parentElement.removeChild(this.element);

    }

    public renderNode(node: Node): void {
        if (node.nodeType === Node.TEXT_NODE && node.parentNode.nodeType !== Node.COMMENT_NODE) {
            this.renderText(node as Text);
        } else if (node instanceof Element && node.nodeType === Node.ELEMENT_NODE) {
            this.renderHtmlElement(node);
        }
    }

    public async nextTick(callback) {
        return new Promise<any>(resolve => {
            this.nextTicksCallbackList.push(callback, resolve);
        });
    }

    public renderHtmlElement(ele: Element) {
        const names = ele.getAttributeNames();
        const directiveNames = names.filter(name => name.startsWith('c-'));
        const directiveInfos = [];
        for (const directiveName of directiveNames) {
            const [realName, attribute] = directiveName.split(':');
            const directive = this.getMatchedDirective(realName);
            if (directive) {
                const params = {
                    key: realName,
                    attribute,
                    expression: ele.getAttribute(directiveName)
                };
                if (directive.isScoped && ele !== this.element) {
                    const rendererList = directive.defineScope(ele, params);
                    for (const renderer of rendererList) {
                        this.addChildRenderer(renderer);
                    }
                    return;
                }
                directiveInfos.push({
                    directive,
                    params
                });
            }
        }
        for (const { directive, params } of directiveInfos) {
            this.renderDirective(ele, directive, params);
        }
    }

    private getMatchedDirective(uniqueName: string): Directive {
        const target = this.directives.find(
            d => d.name === uniqueName
        );
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

    private renderText(textNode: Text) {
        const { textContent } = textNode || {};
        const data = getBindingExpressions(textContent || '');
        const { expressions } = data;
        if (expressions.length > 0) {
            const renderId = genUniqueId();
            this.renderingMapping[renderId] = {
                id: renderId,
                type: RenderType.TEXT,
                target: textNode,
                data
            };
            this.renderSingleItemDelay(renderId);
        }
        return true;
    }


    private renderDirective(ele: Element, directive: Directive, params: DirectiveParams) {
        const renderId = genUniqueId();
        const trans: any = {};
        this.renderingMapping[renderId] = {
            id: renderId,
            type: RenderType.DIRECTIVE,
            target: ele,
            renderer: directive,
            data: {
                params, trans
            }
        };
        const preventSub: boolean | Promise<boolean> = directive.created.call(this.context, ele);
        this.renderSingleItemDelay(renderId);
        // todo - after render?
        return preventSub;
    }

    private renderSingleDirective(renderId: string) {
        const renderItem = this.renderingMapping[renderId] || {};
        const { id, type, renderer, data: { params = {}, trans = {} } = {}, target } = renderItem as RenderItem || {};
        if (renderer) {
            renderer.render.call(this.context, { target, params, trans });
        }
    }

    public renderSingleItemDelay(renderId: string): void {

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
                [RenderType.DIRECTIVE]: () => this.renderSingleDirective(renderId)
            }, () => undefined);
            if (mapper[type]()) {
                this.afterItemRenderedCallbackList.forEach(
                    callback => {
                        callback.call(this, renderItem);
                    }
                );
            }
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

    afterItemRendered(callback: (item: RenderItem) => any) {
        if (typeof callback === 'function') {
            this.afterItemRenderedCallbackList.push(callback);
        }
    }

}