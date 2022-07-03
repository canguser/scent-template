export * as Scent from '../../dist/scent.template.esm.js';
import '../VueReactiveAdaptor.js';
export * as Reactivity from 'https://unpkg.com/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';


export const $_ = (function (exports) {
    'use strict';

    function neverPromise() {
        return new Promise(() => undefined);
    }

    const defaultContext = {};
    function debounce(duringOrOptions = 200) {
        const debounceOptions = typeof duringOrOptions === 'number' ? { during: duringOrOptions } : duringOrOptions;
        const {
            leading = false,
            during = 200,
            context = defaultContext,
            uniqueApi = 'defaultApi',
            callback = () => undefined
        } = debounceOptions;
        const eqName = `_debounce_${uniqueApi}`;
        if (!leading) {
            clearTimeout(context[eqName]);
        }
        if (!leading || !context[eqName]) {
            return new Promise((resolve) => {
                context[eqName] = setTimeout(() => {
                    context[eqName] = undefined;
                    resolve(callback());
                }, during);
            });
        } else {
            return neverPromise();
        }
    }

    exports.debounce = debounce;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;
})({});