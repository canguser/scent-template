import { BasicStrategy } from './BasicStrategy';
import { StrategyType } from '../enum/StrategyType';
import { getAttributeNodes } from '../utils/DomHelper';
import { Context } from '../context/Context';

export class ForStrategy extends BasicStrategy {
    type = StrategyType.Alienated_UNIQUE;
    prefixList: string[] = ['s-for'];

    match<C extends Context>(element: Element, context: C, subScopes: (target, context?: Context) => string[]): string[] | false {
        const attributeNode = getAttributeNodes(element, this.prefixList)[0];
        if (!attributeNode) {
            return false;
        }
        const keyAttribute = element.getAttribute('s-key');
        const [, item] = attributeNode.name.split(':');
        const targetKey = attributeNode.value;
        element.removeAttribute(attributeNode.name);
        element.removeAttribute('s-key');
        return [
            context.scope.bindFor(element, {
                of: targetKey,
                key: keyAttribute,
                item,
                subScopes: (target, context) => subScopes(target, context)
            })
        ];
    }
}
