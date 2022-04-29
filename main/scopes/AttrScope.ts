import { BasicScope, BasicScopeOptions } from './BasicScope';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';
import { toDashName } from '../utils/NormalUtils';

export interface AttrScopeOptions extends BasicScopeOptions {
    attr: string;
    expression: string;
    subScopes?: never;
}

export class AttrScope extends BasicScope<Element, AttrScopeOptions> {
    originValue: string;

    init() {
        this.originValue = this.target.getAttribute(this.options.attr);
    }

    render(): void {
        const { attr, expression } = this.options;
        let value = execExpression('(' + expression + ')', this.getContextObject());
        const { _bindAttr } = this.target as any;
        if (_bindAttr) {
            _bindAttr[attr] = value;
        } else {
            if (attr === 'class') {
                if (Array.isArray(value)) {
                    value = value.filter((v) => v).join(' ');
                } else if (typeof value === 'object') {
                    value = Object.keys(value)
                        .filter((v) => value[v])
                        .join(' ');
                }
                if (this.originValue && this.originValue.trim()) {
                    value = [this.originValue, value].join(' ');
                }
            }
            if (attr === 'style') {
                if (typeof value === 'object') {
                    value = Object.keys(value)
                        .map((v) => `${toDashName(v)}: ${value[v]}`)
                        .join(';');
                }
                if (this.originValue && this.originValue.trim()) {
                    value = [this.originValue, value].join(';');
                }
            }
            this.target.setAttribute(attr, value);
        }
    }
}
