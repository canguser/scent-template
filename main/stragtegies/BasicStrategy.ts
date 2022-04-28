import { Context } from '../context/Context';
import { StrategyType } from '../enum/StrategyType';
import { ScentObject } from '../utils/ScentObject';

export abstract class BasicStrategy<T = Element> extends ScentObject{
    type: StrategyType = StrategyType.Inherited;
    abstract match<C extends Context>(element: T, context: C): boolean;
}
