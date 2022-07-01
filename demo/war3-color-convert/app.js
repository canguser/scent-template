import { Reactivity, Scent } from './lib.js';
import { colorShow } from './components/color-show.js';
import { colorRichText } from './components/color-rich-text.js';
const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

window.Scent = Scent;

export const app = (window.p = defineComponent({
    components: { colorShow, colorRichText },
    template: `
        <p class="text_center">转颜色代码（可以复制 Word 或网页上携带格式的文字）</p>
        <p class="text_center">需要注意的是，文字颜色若是黑色可能看不见</p>
        <color-rich-text></color-rich-text>
        <p class="text_center">颜色代码预览（用于预览转化后的代码）</p>
        <color-show></color-show>
    `
}));
