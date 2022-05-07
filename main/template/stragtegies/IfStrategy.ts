import { BasicStrategy } from './BasicStrategy';
import { Context } from '../../core/context/Context';
import { StrategyType } from '../enum/StrategyType';

export class IfStrategy extends BasicStrategy {
    type: StrategyType = StrategyType.Alienated_UNIQUE;

    key: string = 's-if';

    match<C extends Context>(
        element: Element,
        context: C,
        subScopes: (target, context?: Context) => string[]
    ): string[] | false {
        if (!element.hasAttribute?.(this.key)) return false;
        const expression = element.getAttribute(this.key);
        element.removeAttribute(this.key);
        return [
            context.scope.bindIf(element, {
                expression,
                subScopes: (target, context) => {
                    return subScopes(target, context);
                }
            })
        ];
    }
}
