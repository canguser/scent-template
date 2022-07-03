import { $_, Reactivity, Scent } from '../lib.js';
import { convertFromColor } from '../color-convert.js';
const { defineComponent } = Scent;
const { reactive, computed, ref, toRefs, toRef } = Reactivity;

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
            {watchValue}
        </div>
    `,
    setup(props, instance) {
        const value = toRef(props, 'value');
        const realValue = ref('');
        const watchValue = computed(() => {
            realValue.value = value.value || '';
        });
        const convertedHtml = computed(() => convertFromColor(realValue.value));
        function submitValue(value) {
            realValue.value = value;
            const box = instance.target.querySelector('.color-display-box');
            instance.target.dispatchEvent(
                new CustomEvent('updatevalue', {
                    detail: {
                        value: realValue.value,
                        html: box.innerHTML
                    }
                })
            );
        }
        return {
            value: realValue,
            watchValue,
            convertedHtml,
            updateValue(e) {
                $_.debounce(200).then(() => {
                    submitValue((e.target.value || '').replace(/[\n\r]/g, '|n'));
                });
            }
        };
    }
});
