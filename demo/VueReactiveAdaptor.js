export * as Scent from './libs/scent.template.esm.js';
export * as Reactivity from './libs/reactivity.esm-browser.js';
import { ProxyAdaptor, use } from './libs/scent.core.esm.js';
import { scentTemplate } from './libs/scent.template.esm.js';
import {
    ReactiveEffect,
    reactive,
    readonly as rd
} from './libs/reactivity.esm-browser.js';


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

use(({ configuration }) => {
    const scopeManager = (window.scopeManager = configuration.get('instances.scopeManager'));
    scopeManager.adaptProxy(new VueReactiveAdaptor());
});

use(scentTemplate);
