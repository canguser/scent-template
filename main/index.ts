import { App, Component } from './interface/common';
import { ScentRenderer } from './classes/ScentRenderer';

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
        context: app.data(),
        adaptor: app.adaptor
    });
}
