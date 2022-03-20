import { RenderScope } from './RenderScope';

export interface Renderer<T = any> {
    context: object;

    virtualElement: T;

    realElement: T;

    scopesMapper: { [id: string]: RenderScope };

    parent: Renderer<T>;

    children: Renderer<T>[];

    /**
     * render visual element from context & scopes
     */
    render(): void;

    /**
     * apply real element from visual element
     */
    mount(target?: T): void;

    /**
     * reset real element
     */
    unmount(): void;

    /**
     * generate new scopes from visual element
     */
    compile(): void;

    renderById(id: string): void;

    watchSingleRender(before: (scopeId: string) => void, after: (scopeId: string) => void): string;

    unwatchSingleRender(id: string): void;

    renderByIdList(ids: string[]): void;
}
