import { execExpression, getBindingExpressions } from '../utils/ExpressionHelper';
import { ExpressionRaw } from '../interface/normal.interface';
import { waitImmediately } from '../utils/NormalUtils';
import { getAllElements } from '../utils/DomHelper';

type RenderSingleText = (textNode: Text) => void

type RenderDelayCallback = (
    {
        renderSingleText
    }: {
        renderSingleText: RenderSingleText
    }) => void

export class HtmlRenderer {

    private textExpressionMapping = new Map<Text, ExpressionRaw>();
    private attributeExpressionMapping = new Map<Element, ExpressionRaw>();
    private eventExpressionMapping = new Map<Element, ExpressionRaw>();

    private allElements: Element[] = [];
    private allTextNodes: Text[] = [];

    private onTextRenderedCallbackList: Array<(textNode: Text) => any | void> = [];
    private beforeRenderedCallbackList: Array<() => any | void> = [];
    private afterRenderedCallbackList: Array<() => any | void> = [];
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

    async renderSingleTextDelay(textNode: Text) {
        this.renderDelayCallbackList.push(() => {
            this.renderSingleText(textNode);
        });
        await waitImmediately();
        this.render();
        return textNode;
    }

    private renderText() {
        for (const textNode of this.allTextNodes) {
            const { textContent } = textNode || {};
            const data = getBindingExpressions(textContent || '');
            const { expressions } = data;
            if (expressions.length > 0) {
                this.textExpressionMapping.set(textNode, data);
                this.renderSingleText(textNode);
            }
        }
    }

    private renderSingleText(textNode: Text) {
        if (this.textExpressionMapping.has(textNode)) {
            const { raw, expressions } = this.textExpressionMapping.get(textNode);
            const copyRaw = [...raw];
            expressions.forEach((expression, i) => {
                copyRaw.splice(i + 1, 0, execExpression(expression, this.context));
            });
            textNode.textContent = copyRaw.join('');
            this.onTextRenderedCallbackList.forEach(
                callback => {
                    callback.call(this, textNode);
                }
            );
        }
    }

    onTextRendered(callback: (textNode: Text) => any | void) {
        if (typeof callback === 'function') {
            this.onTextRenderedCallbackList.push(callback);
        }
    }

    private renderAttribute() {
    }

    bindEvent() {
    }

}