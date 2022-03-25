import { ProxyAdaptor } from '../dist/scent.template.esm.js';
import { ReactiveEffect } from 'https://cdn.jsdelivr.net/npm/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';

export class VueReactiveAdaptor extends ProxyAdaptor {

    effectIdMap = {};

    renderIdList = [];

    renderer;

    waitNextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }

    async renderIds(...ids) {
        for (let id of ids) {
            if (this.renderIdList.indexOf(id) === -1) {
                this.renderIdList.push(id);
            }
        }
        if (this.renderer) {
            await this.waitNextFrame();
            if (this.renderIdList.length > 0) {
                console.time('rendered');
                this.renderIdList.forEach((id) => {
                    this.renderer.renderById(id);
                });
                console.timeEnd('rendered');
                this.renderIdList = [];
            }
        }
    }

    initialize() {
        this.renderer.surroundSingleRender((render, id) => {
            let effect = this.effectIdMap[id];
            if (effect) {
                effect.stop();
            }
            effect = new ReactiveEffect(
                () => {
                    render();
                },
                () => {
                    this.renderIds(id);
                }
            );
            effect.run();
            this.effectIdMap[id] = effect;
        });
    }
}