import { App, Component } from './interface/common';
import { ScentRenderer } from './classes/ScentRenderer';
import { traversingTreeNode } from './utils/NormalUtils';

export * from './classes/ScentRenderer';
export * from './classes/ProxyAdaptor';

export function createComponent(component: Component) {
    return component;
}

export function createApp(app: App) {
    return new ScentRenderer({
        mount: app.mount,
        scopeOptions: {
            component: {
                components: app.components
            }
        },
        autoInit: app.autoInit,
        replaceMounted: app.replaceMounted,
        context: app.data?.(),
        adaptor: app.adaptor
    });
}

export function getByScopeId(ele, scopeId) {
    let result;
    traversingTreeNode(ele, 'childNodes', (node) => {
        if (node._scopes) {
            const scope = node._scopes.find((item) => item.id === scopeId);
            if (scope) {
                result = {
                    node,
                    scope
                };
            }
        }
    });
    return result;
}
