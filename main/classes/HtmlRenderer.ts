import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import { ExpressionRaw, RenderItem, RenderType } from '../interface/normal.interface';
import { genStrategyMapper, genUniqueId, waitImmediately } from '../utils/NormalUtils';
import { getAllElements } from '../utils/DomHelper';

type RenderSingleText = (textNode: Text) => void

type RenderDelayCallback = (
    {
        renderSingleText
    }: {
        renderSingleText: RenderSingleText
    }) => void

export class HtmlRenderer {

    private renderingMapping: { [key: string]: RenderItem } = Object.create(null);

    private allElements: Element[] = [];
    private allTextNodes: Text[] = [];

    private afterItemRenderedCallbackList: Array<(renderItem: RenderItem) => any> = [];
    private afterRenderedCallbackList: Array<() => any | void> = [];

    private beforeRenderedCallbackList: Array<() => any | void> = [];
    private renderDelayCallbackList: Array<RenderDelayCallback> = [];

    constructor(private element: Element, private context: any) {
        this.allElements = getAllElements(element);
        this.allTextNodes = this.allElements.map(element => ([...element.childNodes] as Text[]).filter(node => node.nodeName === '#text')).flat();
        waitImmediately().then(() => {
            this.render(true);
        });
    }

    render(force = false) {

        // call before hooks
        this.beforeRenderedCallbackList.forEach(
            callback => {
                callback.call(this);
            }
        );

        // render logic
        if (force) {
            this.renderText();
            this.renderAttribute();
        } else {
            if (!this.renderDelayCallbackList || this.renderDelayCallbackList.length === 0) {
                return this.element;
            }
            for (const callback of this.renderDelayCallbackList) {
                callback.call(this, this);
            }
            this.renderDelayCallbackList = [];
        }

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

    private renderText() {
        for (const textNode of this.allTextNodes) {
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
                this.renderSingleItem(renderId);
            }
        }
    }

    public async renderSingleItemDelay(renderId: string) {
        this.renderDelayCallbackList.push(() => {
            this.renderSingleItem(renderId);
        });
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

    private renderAttribute() {
    }

    bindEvent() {
    }

}