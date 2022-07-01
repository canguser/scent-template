import { Reactivity, Scent } from './lib.js';
import { colorShow } from './components/color-show.js';
import { colorRichText } from './components/color-rich-text.js';
const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

window.Scent = Scent;

export const app = (window.p = defineComponent({
    components: { colorShow, colorRichText },
    template: `
        <p class="text_center">颜色代码预览</p>
        <color-show></color-show>
        <p class="text_center">转颜色代码</p>
        <color-rich-text></color-rich-text>
    `
}));
