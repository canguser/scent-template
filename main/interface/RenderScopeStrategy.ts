import { RenderScope } from './RenderScope';
import { ScopeType } from '../enum/ScopeType';
import { ScentRenderer } from '../classes/ScentRenderer';

export interface RenderScopeStrategy<T> {
    type: ScopeType;
    identityName?: string;
    renderer?: ScentRenderer;
    match(target: T): RenderScope<T> | RenderScope<T>[] | false;
    setConfigs?(configs: any): void;
}
