import { Reactivity, Scent } from '../lib.js';
import { convertFromColor } from '../color-convert.js';
const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

export const colorShow = defineComponent({
    name: 'color-show',
    template: `
        <div class="display-flex flex-justify_center">
            <div class="left-box">
                <textarea name="test" id="" cols="30" rows="10" s-model="value" @input="updateValue"></textarea>
            </div>
            <div class="right-box" >
                <div class="color-display-box" s-html="convertedHtml"></div>
            </div>
        </div>
    `,
    setup(props, instance) {
        const value = ref('');
        const convertedHtml = computed(() => convertFromColor(value.value));
        return {
            value,
            convertedHtml,
            updateValue(e) {
                instance.nextTick(() => {
                    value.value = (e.target.value || '').replace(/[\n\r]/g, '|n');
                });
            }
        };
    }
});
