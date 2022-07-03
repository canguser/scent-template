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
        <color-rich-text s-model:value.updatevalue="htmlCode" @updatevalue="changeColorCode"></color-rich-text>
        <!--<p>{htmlCode}</p>-->
        <div class="options">
        <label>
                <input type="checkbox" s-model:checked.input="autoHtml2Code" @change="syncCacheCode">
                自动同步（往下）
        </label>
        <label>
                <input type="checkbox" s-model:checked.input="autoCode2Html" @change="syncCacheHtml">
                自动同步（往上）
        </label>
        
        <label>
                固定换行
                <input type="number" s-model="newLineNum" @change="syncCacheCode">
        </label>
        </div>
        <p class="text_center">颜色代码预览（用于预览转化后的代码）</p>
        <color-show s-model:value.updatevalue="colorCode" @updatevalue="changeHtmlCode"></color-show>
        <!--<p>{colorCode}</p>-->
    `,
    setup() {
        const colorCode = ref('');
        const cacheColorCode = ref('');
        const htmlCode = ref('');
        const cacheHtmlCode = ref('');
        const newLineNum = ref(0);
        const autoHtml2Code = ref(false);
        const autoCode2Html = ref(false);
        function syncCacheHtml(e) {
            // 往上同步
            if (!e || e.target.checked) {
                htmlCode.value = cacheHtmlCode.value;
            }
        }
        function syncCacheCode(e) {
            // 往下同步
            if (!e || e.target.checked || parseInt(e.target.value) >= 0) {
                const num = parseInt(newLineNum.value, 10);
                const reg = new RegExp(`(\\|n)+`, 'g');
                let codeValue = cacheColorCode.value;
                if (num > 0) {
                    codeValue = codeValue.replace(reg, '|n'.repeat(num));
                }
                colorCode.value = codeValue;
            }
        }
        return {
            newLineNum,
            autoHtml2Code,
            autoCode2Html,
            colorCode,
            htmlCode,
            syncCacheHtml,
            syncCacheCode,
            changeHtmlCode(e) {
                // 往上同步
                cacheHtmlCode.value = e.detail.html;
                if (autoCode2Html.value) {
                    console.log(e.detail.html);
                    syncCacheHtml();
                }
            },
            changeColorCode(e) {
                // 往下同步
                cacheColorCode.value = e.detail.code;
                if (autoHtml2Code.value) {
                    syncCacheCode();
                }
            }
        };
    }
}));
