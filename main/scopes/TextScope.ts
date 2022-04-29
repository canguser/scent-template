import { BasicScope, BasicScopeOptions } from './BasicScope';
import { template } from '@rapidly/utils/lib/commom/string/template';

export interface TextScopeOptions extends BasicScopeOptions {
    expression: string;
}

export class TextScope extends BasicScope<Element, TextScopeOptions> {
    render(): void {
        const oldContent = this.target.textContent;
        const newContent = template(this.options.expression, this.getContextObject(), { withFunction: true });
        if (oldContent !== newContent) {
            this.target.textContent = newContent;
        }
    }
}
