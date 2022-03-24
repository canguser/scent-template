import { RenderScope } from './RenderScope';

export interface Renderer<T = any> {
    context: object;

    virtualElement: T;

    realElement: T;

    scopesMapper: { [id: string]: RenderScope };

    parent: Renderer<T>;

    children: Renderer<T>[];

    identity: any;

    parentRenderId: string;

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

    destroy(): void;

    linkParent(parent: Renderer<T>, identity: any, parentRenderId: string): void;

    unlinkParent(): void;

    unlinkChild(renderId: string, identity: any): void;

    renderById(id: string): void;

    watchSingleRender(before: (scopeId: string) => void, after: (scopeId: string) => void): string;

    surroundSingleRender(hook: (render: Function, renderId: string) => void): string;

    unrollSingleRender(id: string): void;

    unwatchSingleRender(id: string): void;

    renderByIdList(ids: string[]): void;
}
