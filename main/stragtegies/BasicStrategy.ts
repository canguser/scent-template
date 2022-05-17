import { StrategyType } from '../enum/StrategyType';
import { Context } from '@scent/core/typing/context/Context';
import { ScentObject } from '@scent/core/typing/utils/ScentObject';

export abstract class BasicStrategy<T = Element> extends ScentObject {
    type: StrategyType = StrategyType.Inherited;
    abstract match<C extends Context>(element: T, context: C, subScopes?: (target, context?: Context) => string[]): string[] | false;
}
