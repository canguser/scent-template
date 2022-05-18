import { StrategyType } from '../enum/StrategyType';
import { Context } from '@scent/core/typing/context/Context';

export abstract class BasicStrategy<T = Element> {
    type: StrategyType = StrategyType.Inherited;
    abstract match<C extends Context>(element: T, context: C, subScopes?: (target, context?: Context) => string[]): string[] | false;
}
