import { BasicScope, BasicScopeOptions } from './BasicScope';
import { template } from '@rapidly/utils/lib/commom/string/template';

export interface TextScopeOptions extends BasicScopeOptions {
    expression: string;
}

export class TextScope extends BasicScope<Element, TextScopeOptions> {
    render(): void {
        const originalText = this.target.textContent;
        const text = template(this.options.expression, this.getContextObject(), { withFunction: true });
        if (originalText !== text) {
            this.target.textContent = text;
        }
    }
}
