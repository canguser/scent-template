import { RenderScope } from '../interface/RenderScope';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';
import { toCamelName, toDashName } from '../utils/NormalUtils';

export class BindRenderScope implements RenderScope {
    expression: string;
    target: any;
    attribute: string;
    originValue: string;

    constructor(expression: string, target: any, attribute: string) {
        this.expression = expression;
        this.target = target;
        this.attribute = attribute;
        this.originValue = this.target.getAttribute(this.attribute);
    }

    render(context: () => object): void {
        let value = execExpression('(' + this.expression + ')', context());
        const { _bindAttr } = this.target;
        // console.log('setAttribute', this.attribute, value);
        if (_bindAttr) {
            _bindAttr[this.attribute] = value;
        } else {
            if (this.attribute === 'class') {
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
            if (this.attribute === 'style') {
                if (typeof value === 'object') {
                    value = Object.keys(value)
                        .map((v) => `${toDashName(v)}: ${value[v]}`)
                        .join(';');
                }
                if (this.originValue && this.originValue.trim()) {
                    value = [this.originValue, value].join(';');
                }
            }
            this.target.setAttribute(this.attribute, value);
        }
    }
}

export class BindRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Inherited;
    prefixAlisa: string[] = ['s-bind', ':'];

    identityName = 'bind';

    match(target: Element): RenderScope<Element>[] | false {
        const [prefix, alias] = this.prefixAlisa;
        const attrInfos = getAttributeInfoMapping(target, [prefix], { [prefix]: alias })[prefix] || [];
        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.map((attr) => {
            const scope = new BindRenderScope(attr.value, target, toCamelName(attr.name));
            // remove all related attributes from target
            target.removeAttribute(attr.fullName);
            return scope;
        });
    }
}
