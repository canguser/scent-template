import { ProxyAdaptor, configuration } from '../dist/scent.template.esm.js';
import {
    ReactiveEffect,
    reactive,
    readonly as rd
} from 'https://unpkg.com/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';

class VueReactiveAdaptor extends ProxyAdaptor {
    initialize() {
        this.scopeManager.registerRenderHooks((render, id) => {
            let effect = new ReactiveEffect(
                () => {
                    // console.log('reactive effect', id);
                    render();
                    // console.log('reactive effect end', id);
                },
                () => {
                    effect.stop();
                    // console.log('to render _', id);
                    this.renderIds(id);
                }
            );
            effect.run();
        });
    }

    create(data, readonly) {
        if (readonly) {
            return rd(data);
        }
        return reactive(data);
    }
}

const scopeManager = window.scopeManager = configuration.get('instances.scopeManager');
scopeManager.adaptProxy(new VueReactiveAdaptor());