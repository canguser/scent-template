import { RenderScope } from './RenderScope';
import { ScopeType } from '../enum/ScopeType';

export interface RenderScopeStrategy<T> {
    type: ScopeType;
    match(target: T): RenderScope<T> | RenderScope<T>[] | false;
}
