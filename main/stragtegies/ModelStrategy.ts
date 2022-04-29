import { BasicStrategy } from './BasicStrategy';
import { Context } from '../context/Context';
import { StrategyType } from '../enum/StrategyType';
import { getAttributeInfoMapping } from '../utils/DomHelper';

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
            const { value, name, more } = attr;
            scopes.push(
                context.scope.bindSetter(element, {
                    property: 'value',
                    expression: value
                })
            );
            scopes.push(
                context.scope.bindAttr(element, {
                    attr: name || value,
                    expression: value
                })
            );
            scopes.push(
                context.scope.bindEvent(element, {
                    eventName: more || 'input',
                    expression: `e=>((${value})=e.detail?e.detail.value:(e.target?e.target.value:null))`
                })
            );
            // remove all related attributes from target
            element.removeAttribute(attr.fullName);
            return scopes;
        }, []);
    }
}
