import { RenderScope } from '../interface/RenderScope';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';

export class BindRenderScope implements RenderScope {
    expression: string;
    target: any;
    attribute: string;

    constructor(expression: string, target: any, attribute: string) {
        this.expression = expression;
        this.target = target;
        this.attribute = attribute;
    }

    render(context: ()=>object): void {
        const value = execExpression(this.expression, context());
        this.target.setAttribute(this.attribute, value);
        const { _bindAttr = {} } = this.target;
        Object.defineProperty(_bindAttr, this.attribute, {
            get: () => {
                return execExpression(this.expression, context());
            },
            configurable: true,
            enumerable: true
        });
        this.target['_bindAttr'] = _bindAttr;
    }
}

export class BindRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Inherited;
    prefixAlisa: string[] = ['s-bind', ':'];

    match(target: Element): RenderScope<Element>[] | false {
        const [prefix, alias] = this.prefixAlisa;
        const attrInfos = getAttributeInfoMapping(target, [prefix], { [prefix]: alias })[prefix] || [];
        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.map((attr) => {
            const scope = new BindRenderScope(attr.value, target, attr.name);
            // remove all related attributes from target
            target.removeAttribute(attr.fullName);
            return scope;
        });
    }
}
