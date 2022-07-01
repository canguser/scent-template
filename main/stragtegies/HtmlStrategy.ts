import { BasicStrategy } from './BasicStrategy';
import { StrategyType } from '../enum/StrategyType';
import { Context } from '@scent/core/typing/context/Context';

export class HtmlStrategy extends BasicStrategy {
    type: StrategyType = StrategyType.Alienated_UNIQUE;

    key: string = 's-html';

    match<C extends Context>(
        element: Element,
        context: C,
        subScopes: (target, context?: Context) => string[]
    ): string[] | false {
        if (!element.hasAttribute?.(this.key)) return false;
        const expression = element.getAttribute(this.key);
        element.removeAttribute(this.key);
        return [
            context.scope.bindHtml(element, {
                expression
            })
        ];
    }
}
