import { BasicStrategy } from './BasicStrategy';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { Context } from '@scent/core/typing/context/Context';

export class ModelStrategy extends BasicStrategy {
    prefixList: string[] = ['s-model'];

    match<C extends Context>(element: Element, context: C): string[] | false {
        const [prefix, alias] = this.prefixList;
        const attrInfos = getAttributeInfoMapping(element, [prefix], { [prefix]: alias })[prefix] || [];
        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.reduce((scopes: string[], attr) => {
            let { value, name, more } = attr;
            name = name || 'value'
            scopes.push(
                context.scope.bindAttr(element, {
                    attr: name,
                    expression: value
                })
            );
            scopes.push(
                context.scope.bindEvent(element, {
                    eventName: more || 'input',
                    expression: `e=>((${value})=e.detail?e.detail.${name}:(e.target?e.target.${name}:null))`
                })
            );
            // remove all related attributes from target
            element.removeAttribute(attr.fullName);
            return scopes;
        }, []);
    }
}
