import { BasicStrategy } from './BasicStrategy';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { toCamelName } from '../utils/NormalUtils';
import { Context } from '@scent/core/typing/context/Context';

export class AttrStrategy extends BasicStrategy {
    prefixAlisa: string[] = ['s-bind', ':'];

    match<C extends Context>(element: Element, context: C): string[] | false {
        if (element.nodeType === Node.ELEMENT_NODE) {
            const [prefix, alias] = this.prefixAlisa;
            const attrInfos = getAttributeInfoMapping(element, [prefix], { [prefix]: alias })[prefix] || [];
            if (attrInfos.length === 0) {
                return false;
            }
            // generate render scopes from attribute nodes
            return attrInfos.map((attr) => {
                element.removeAttribute(attr.fullName);
                return context.scope.bindAttr(element, {
                    attr: toCamelName(attr.name),
                    expression: attr.value
                });
            });
        }
        return false;
    }
}
