import { BasicScope, BasicScopeOptions } from './BasicScope';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';

export interface ElementSetterScopeOptions extends BasicScopeOptions {
    property: string;
    expression: string;
    subScopes?: never;
}

export class ElementSetterScope extends BasicScope<Element, ElementSetterScopeOptions> {
    render(): void {
        this.target[this.options.property] = execExpression(this.options.expression, this.getContextObject());
    }
}
