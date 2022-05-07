import { BasicScope, BasicScopeOptions } from './BasicScope';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';

export interface IfScopeOptions extends BasicScopeOptions {
    expression: string;
}

export class IfScope extends BasicScope<Element, IfScopeOptions> {
    lastResult: boolean;
    parentNode: Element;
    placeholder: Comment;
    lastOrderId: string;
    protected readonly aggregated: boolean = true;

    render(): void {
        const condition = !!execExpression(this.options.expression, this.getContextObject());
        if (this.lastResult === condition) {
            if (condition) {
                this.putScopeInfo(this.lastOrderId, this.target);
            }
            return;
        }
        if (!condition && this.target.parentNode) {
            this.parentNode = this.target.parentElement;
            this.placeholder = document.createComment('if:' + this.id);
            this.parentNode.replaceChild(this.placeholder, this.target);
        } else if (condition && this.placeholder && this.parentNode) {
            this.parentNode.replaceChild(this.target, this.placeholder);
            this.putScopeInfo((this.lastOrderId = genOrderedId()), this.target);
        } else if (condition){
            this.putScopeInfo((this.lastOrderId = genOrderedId()), this.target);
        }
        this.lastResult = condition;
    }
}
