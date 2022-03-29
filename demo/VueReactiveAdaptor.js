import { ProxyAdaptor } from '../dist/scent.template.esm.js';
import { ReactiveEffect, reactive } from 'https://cdn.jsdelivr.net/npm/@vue/reactivity@3.2.31/dist/reactivity.esm-browser.js';

export class VueReactiveAdaptor extends ProxyAdaptor {

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
                console.log('render ids', this.renderIdList);
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
            let effect = new ReactiveEffect(
                () => {
                    // console.log('reactive effect', id);
                    render();
                    // console.log('reactive effect end', id);
                },
                () => {
                    effect.stop();
                    this.renderIds(id);
                }
            );
            effect.run();
        });
    }

    create(data){
        return reactive(data);
    }
}