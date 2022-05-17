import { BasicStrategy } from './BasicStrategy';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { Context } from '@scent/core/typing/context/Context';

export class EventStrategy extends BasicStrategy {
    prefixList: string[] = ['s-on', '@'];

    match<C extends Context>(element: Element, context: C): string[] | false {
        const [prefix, alias] = this.prefixList;
        const attrInfos = getAttributeInfoMapping(element, [prefix], { [prefix]: alias })[prefix] || [];

        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.map((attr) => {
            // remove all related attributes from target
            element.removeAttribute(attr.fullName);
            return context.scope.bindEvent(element, {
                eventName: attr.name,
                expression: attr.value
            });
        });
    }
}
