import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import { Directive, DirectiveParams, RenderItem, RenderType } from '../interface/normal.interface';
import {
    compatiblePromise,
    ergodicTree,
    genStrategyMapper,
    genUniqueId,
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
    render(params: DirectiveParams): void {
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
                if (this.childParserMap.has(node)) {
                    this.childParserMap.get(node).renderAll();
                    preventDeeply();
                }
            }
        );
        console.timeEnd('rendering to being ready');
    }

    private childParserMap = new Map<Node, HtmlRenderer>();

    public attachChildParser(node: Node, context: any = {}) {
        this.childParserMap.set(node, new HtmlRenderer({
            ...this.options,
            context: new Proxy(this.context, {
                get(target: any, p: string | symbol, receiver: any): any {
                    if (p in context) {
                        return context[p];
                    }
                    return Reflect.get(target, p, receiver);
                }
            })
        }));
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
                if (directive.isScoped && ele !== this.element) {
                    this.attachChildParser(ele, directive.scopedContext);
                    return;
                }
                directiveInfos.push({
                    directive,
                    params: {
                        key: realName,
                        attribute,
                        expression: ele.getAttribute(directiveName)
                    }
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

    public async render() {

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
        const promise = Promise.all(
            this.renderIdDelayQueue
                .map(async renderId => {
                    const callback = this.renderDelayCallbackMapping[renderId];
                    await waitNextFrame();
                    callback.call(this, this);
                })
        );

        this.renderIdDelayQueue = [];
        this.renderDelayCallbackMapping = {};

        await promise;

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
        this.renderSingleItemDelay(renderId).then(() => {
            directive.afterMounted.call(this.context, ele);
        });
        return preventSub;
    }

    private renderSingleDirective(renderId: string) {
        const renderItem = this.renderingMapping[renderId] || {};
        const { id, type, renderer, data: { params = {}, trans = {} } = {}, target } = renderItem as RenderItem || {};
        if (renderer) {
            renderer.render.call(this.context, { target, params, trans });
        }
    }

    public async renderSingleItemDelay(renderId: string) {
        this.renderIdDelayQueue.push(renderId);
        this.renderDelayCallbackMapping[renderId] = () => this.renderSingleItem(renderId);
        await this.render();
        return this.renderingMapping[renderId];
    }

    private renderSingleItem(renderId: string) {
        if (renderId in this.renderingMapping) {
            const renderItem = this.renderingMapping[renderId];
            const { type } = renderItem || {};
            const mapper = genStrategyMapper({
                [RenderType.TEXT]: () => {
                    this.renderSingleText(renderId);
                },
                [RenderType.DIRECTIVE]: () => {
                    this.renderSingleDirective(renderId);
                }
            }, () => undefined);
            mapper[type]();
        }
    }

    private renderSingleText(renderId: string) {
        if (renderId in this.renderingMapping && this.renderingMapping[renderId].type === RenderType.TEXT) {
            const renderItem = this.renderingMapping[renderId];
            const { data, target } = renderItem || {};
            if (target && inDocument(target)) {
                const { raw, expressions } = data || {};
                const copyRaw = [...raw];
                expressions.forEach((expression, i) => {
                    copyRaw.splice(i + 1, 0, execExpression(expression, this.context));
                });
                target.textContent = copyRaw.join('');
                this.afterItemRenderedCallbackList.forEach(
                    callback => {
                        callback.call(this, renderItem);
                    }
                );
            }
        }
    }

    afterItemRendered(callback: (item: RenderItem) => any) {
        if (typeof callback === 'function') {
            this.afterItemRenderedCallbackList.push(callback);
        }
    }

}