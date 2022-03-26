import { Renderer } from '../interface/Renderer';
import { RenderScope } from '../interface/RenderScope';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';
import { SubRendererParam } from '../interface/SubRendererParam';
import { flat } from '@rapidly/utils/lib/array/flat';
import { groupBy } from '@rapidly/utils/lib/array/groupBy';
import { RenderResult } from '../interface/RenderResult';
import { unmountDom } from '../utils/DomHelper';
import { hasDuplicate } from '../utils/NormalUtils';

export abstract class BasicRenderer<T> implements Renderer<T> {
    _context: object;

    renderIdChildrenMapping: { [id: string]: BasicRenderer<T>[] } = {};

    get children(): BasicRenderer<T>[] {
        return flat(Object.values(this.renderIdChildrenMapping));
    }

    parent: BasicRenderer<T>;
    realElement: T;
    scopesMapper: { [id: string]: RenderScope } = {};
    virtualElement: T;

    singleRenderWatchingMapping: {
        [id: string]: {
            before: (scopeId: string) => void;
            after: (scopeId: string) => void;
        };
    } = {};
    singleRenderSurroundMapping: {
        [id: string]: {
            hook: (render: Function, scopeId: string) => void;
        };
    } = {};

    identity: any;
    parentRenderId: string;
    destroyed: boolean = false;

    abstract compile(): void;

    abstract mount(target?: T): void;

    abstract genSubRenderer(param: SubRendererParam, target?: T): BasicRenderer<T>;

    get context() {
        if (this._context) {
            return this._context;
        }
        if (this.parent){
            return this.parent.context;
        }
        return {};
    }

    set context(context: object) {
        this._context = context;
    }

    linkParent(parent: BasicRenderer<T>, identity: any, parentRenderId: string): void {
        this.parent = parent;
        this.identity = identity;
        this.parentRenderId = parentRenderId;
    }

    unlinkParent() {
        if (this.parent && this.parentRenderId && this.identity) {
            this.parent.unlinkChild(this.parentRenderId, this.identity);
            this.parent = undefined;
            this.identity = undefined;
            this.parentRenderId = undefined;
        }
    }

    unlinkChild(renderId: string, identity: any) {
        const children = this.renderIdChildrenMapping[renderId];
        if (children) {
            this.renderIdChildrenMapping[renderId] = children.filter((child) => {
                const toRemove = child.identity === identity;
                return !toRemove;
            });
        }
    }

    updateSubRenderers(renderId: string, target: T, renderResult: RenderResult) {
        const replaceParent = renderResult.replaceParent;
        const params = renderResult.rendererParams;
        const existSubRenderers = this.renderIdChildrenMapping[renderId] || [];
        let replacedRenderers: BasicRenderer<T>[] = [];
        if (params && params.length > 0) {
            let subRenderersGroupedByIdentity = groupBy(existSubRenderers, 'identity');
            // check if identity in params is non-duplicated
            const identityInParams = params.map((param) => param.identity);
            const hasDuplicatedIdentity = hasDuplicate(identityInParams);
            if (hasDuplicatedIdentity) {
                console.warn('identity in params has duplicated', identityInParams);
                subRenderersGroupedByIdentity = new Map();
                params.forEach((param, i) => {
                    param.identity = i;
                });
            }
            replacedRenderers = this.renderIdChildrenMapping[renderId] = params.map((param, i) => {
                let subRenderer = [...(subRenderersGroupedByIdentity.get(param.identity) || [])][0];
                if (!subRenderer) {
                    const existSubRenderer = existSubRenderers[i];
                    if (!existSubRenderer) {
                        subRenderer = this.genSubRenderer(param, replaceParent ? undefined : target);
                    } else {
                        subRenderer = this.genSubRenderer(param);
                        subRenderer.realElement = existSubRenderer.realElement;
                        existSubRenderer.destroy();
                    }
                    subRenderer.linkParent(this, param.identity, renderId);
                }
                if (subRenderer.context){
                    subRenderer.context = param.context;
                }
                return subRenderer;
            });
        }
        // remove unused sub renderers
        existSubRenderers
            .filter((subRenderer) => {
                return replacedRenderers.indexOf(subRenderer) === -1;
            })
            .forEach((subRenderer) => {
                const realElement = subRenderer.realElement;
                subRenderer.destroy();
                if (realElement) {
                    unmountDom(realElement);
                }
            });
        this.checkToReplaceSubRenderers(renderId, target, replaceParent);
    }

    abstract checkToReplaceSubRenderers(renderId: string, target: T, replaceParent: boolean): void;

    public render(): void {
        const scopeIds = Object.keys(this.scopesMapper) || [];
        scopeIds.forEach((id) => {
            this.renderById(id);
        });
        this.children.forEach((child) => {
            child.render();
        });
    }

    get singleRenderSurroundMappingWithParents() {
        const results = Object.values(this.singleRenderSurroundMapping) || [];
        if (this.parent) {
            results.push(...this.parent.singleRenderSurroundMappingWithParents);
        }
        return results;
    }

    getSurroundHook() {
        const surroundHooks = this.singleRenderSurroundMappingWithParents || [];
        const realSurround = surroundHooks.reduce(
            (prev, curr) => {
                return {
                    hook: (render, id) => {
                        curr.hook(() => {
                            prev.hook(render, id);
                        }, id);
                    }
                };
            },
            {
                hook: (render) => {
                    render();
                }
            }
        );
        return realSurround.hook;
    }

    public renderById(id: string): void {
        const hook = this.getSurroundHook();
        let scope = this.scopesMapper[id];
        if (scope) {
            let renderResult: RenderResult | void;
            hook(() => {
                scope = this.scopesMapper[id];
                this.notifyBeforeSingleRender(id);
                renderResult = scope.render(() => this.context);
                this.notifyAfterSingleRender(id);
            }, id);
            if (renderResult) {
                this.updateSubRenderers(id, scope.target, renderResult);
            }
        } else {
            this.children.forEach((child) => {
                child.renderById(id);
            });
        }
    }

    abstract unmount(): void;

    destroy() {
        if (this.destroyed) {
            return;
        }
        this.children.forEach((child) => {
            child.destroy();
        });
        this.unmount();
        this.unlinkParent();
        this.destroyed = true;
    }

    renderByIdList(ids: string[]): void {
        ids.forEach((id) => {
            this.renderById(id);
        });
    }

    notifyBeforeSingleRender(id: string): void {
        if (this.parent) {
            this.parent.notifyBeforeSingleRender(id);
            return;
        }
        Object.keys(this.singleRenderWatchingMapping).forEach((key) => {
            const watching = this.singleRenderWatchingMapping[key];
            if (watching && typeof watching.before === 'function') {
                watching.before(id);
            }
        });
    }

    notifyAfterSingleRender(id: string): void {
        if (this.parent) {
            this.parent.notifyAfterSingleRender(id);
            return;
        }
        Object.keys(this.singleRenderWatchingMapping).forEach((key) => {
            const watching = this.singleRenderWatchingMapping[key];
            if (watching && typeof watching.after === 'function') {
                watching.after(id);
            }
        });
    }

    watchSingleRender(before: (scopeId: string) => void, after: (scopeId: string) => void): string {
        const id = genOrderedId();
        this.singleRenderWatchingMapping[id] = {
            before,
            after
        };
        return id;
    }

    unwatchSingleRender(id: string): void {
        delete this.singleRenderWatchingMapping[id];
    }

    surroundSingleRender(hook: (render: Function, renderId: string) => void): string {
        const id = genOrderedId();
        this.singleRenderSurroundMapping[id] = { hook };
        return id;
    }

    unrollSingleRender(id: string) {
        delete this.singleRenderSurroundMapping[id];
    }
}
