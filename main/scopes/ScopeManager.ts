import { BasicScope } from './BasicScope';
import { ScentObject } from '../utils/ScentObject';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';
import { ProxyAdaptor } from '../context/ProxyAdaptor';

export class ScopeManager extends ScentObject {
    scopesMapper: { [key: string]: BasicScope } = {};

    private singleRenderSurroundMapping: {
        [id: string]: {
            hook: (render: Function, scopeId: string) => void;
        };
    } = {};

    public registerRenderHooks(hook: (render: Function, scopeId: string) => void) {
        const id = genOrderedId();
        this.singleRenderSurroundMapping[id] = {
            hook
        };
    }

    public removeRenderHooks(id: string) {
        delete this.singleRenderSurroundMapping[id];
    }

    private getSurroundHook() {
        const surroundHooks = Object.values(this.singleRenderSurroundMapping) || [];
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

    public registerScope<T extends BasicScope<any>>(scope: T) {
        this.scopesMapper[scope.id] = scope;
    }

    public unregisterScope(scopeId: string) {
        delete this.scopesMapper[scopeId];
    }

    public renderById(id: string | string[]) {
        return this.renderScope(Array.isArray(id) ? id.map((i) => this.scopesMapper[i]) : this.scopesMapper[id]);
    }

    public renderScope<T extends BasicScope<any>>(scope: T | T[]) {
        if (Array.isArray(scope)) {
            scopeId.forEach((scope) => this.renderScope(scope));
            return;
        }
        if (!scope) {
            return;
        }
        const surroundHook = this.getSurroundHook();
        surroundHook(() => {
            scope.render();
        }, scope.id);
        scope.renderSubScopes();
        return;
    }

    public proxyAdaptor: ProxyAdaptor = new ProxyAdaptor();

    public adaptProxy(adaptor: ProxyAdaptor) {
        adaptor.scopeManager = this;
        this.proxyAdaptor = adaptor;
        adaptor.initialize();
    }
}
