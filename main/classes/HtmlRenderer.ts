import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import { RenderItem, RenderType } from '../interface/normal.interface';
import { genStrategyMapper, genUniqueId, waitImmediately } from '../utils/NormalUtils';
import { getAllNodes } from '../utils/DomHelper';

type RenderSingleText = (textNode: Text) => void

type RenderDelayCallback = (
    {
        renderSingleText
    }: {
        renderSingleText: RenderSingleText
    }) => void

export class HtmlRenderer {

    private renderingMapping: { [renderId: string]: RenderItem } = Object.create(null);

    private allNodes: Node[] = [];

    private afterItemRenderedCallbackList: Array<(renderItem: RenderItem) => any> = [];
    private afterRenderedCallbackList: Array<() => any | void> = [];

    private beforeRenderedCallbackList: Array<() => any | void> = [];
    private renderIdDelayQueue: Array<string> = [];
    private renderDelayCallbackMapping: { [renderId: string]: () => any } = Object.create(null);

    constructor(private element: Element, private context: any) {
        this.renderAll();
    }

    public async renderAll() {
        this.allNodes = getAllNodes(this.element);
        return Promise.all(this.allNodes.map(node => this.renderNode(node)));
    }

    public async renderNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE && node.parentNode.nodeType !== Node.COMMENT_NODE) {
            await this.renderText(node as Text);
        } else if (node instanceof Element && node.nodeType === Node.ELEMENT_NODE) {
            await this.renderHtmlElement(node);
        }
    }

    public async renderHtmlElement(ele: Element) {
        ele.getAttributeNames();
    }

    public async render() {

        // call before hooks
        this.beforeRenderedCallbackList.forEach(
            callback => {
                callback.call(this);
            }
        );

        // render logic
        if (!this.renderIdDelayQueue || this.renderIdDelayQueue.length === 0) {
            return this.element;
        }

        const promise = Promise.all(
            this.renderIdDelayQueue
                .map(async renderId => {
                    const callback = this.renderDelayCallbackMapping[renderId];
                    await waitImmediately();
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

    private async renderText(textNode: Text) {
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
            await this.renderSingleItemDelay(renderId);
        }
    }

    public async renderSingleItemDelay(renderId: string) {
        this.renderIdDelayQueue.push(renderId);
        this.renderDelayCallbackMapping[renderId] = () => this.renderSingleItem(renderId);
        await waitImmediately();
        this.render();
        return this.renderingMapping[renderId];
    }

    private renderSingleItem(renderId: string) {
        if (renderId in this.renderingMapping) {
            const renderItem = this.renderingMapping[renderId];
            const { type } = renderItem || {};
            const mapper = genStrategyMapper({
                [RenderType.TEXT]: () => {
                    this.renderSingleText(renderId);
                }
            }, () => undefined);
            mapper[type]();
        }
    }

    private renderSingleText(renderId: string) {
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