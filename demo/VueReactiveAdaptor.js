import { ProxyAdaptor } from '../dist/scent.template.esm.js';
import {
    ReactiveEffect,
    reactive,
    readonly as rd,
    effect
} from 'https://unpkg.com/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';

// window.a = reactive({});
// window.ar = rd(a);
//
// window.ao = reactive({
//     $props: ar,
//     c: 3
// });
//
// window.effect = effect;
//
// effect(() => {
//     console.log(window.ao.$props.a);
// });

export class VueReactiveAdaptor extends ProxyAdaptor {
    renderIdList = [];

    renderer;

    doInTicks = [];

    waitNextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }

    async renderIds(...ids) {
        for (let id of ids) {
            const renderIdIndex = this.renderIdList.indexOf(id);
            if (renderIdIndex > -1) {
                this.renderIdList.splice(renderIdIndex, 1);
            }
            this.renderIdList.push(id);
        }
        if (this.renderer) {
            await this.waitNextFrame();
            if (this.renderIdList.length > 0) {
                console.time('rendered');
                while (this.renderIdList.length > 0) {
                    const renderIds = this.renderIdList.splice(0);
                    // console.log('render ids', renderIds);
                    renderIds.forEach((id) => {
                        this.renderer.renderById(id);
                    });
                }
                console.timeEnd('rendered');
                this.execTickDoings();
            }
        }
    }

    initialize() {
        this.renderer.surroundSingleRender((render, id) => {
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
