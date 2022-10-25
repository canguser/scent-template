import { Reactivity, Scent } from './lib.js';

const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

window.Scent = Scent;

export const app = (window.p = defineComponent({
    template: `
    <div>
        <div class="text-box" s-if="codes.length > 0">
            <b>加群福利码（于 {codes[0].start} 更新）：</b><br>
            1. 开局金木资源各加1000[无难度限制]：<br>
            <b @click="copy">{codes[2].code}</b><br><br>
            2. 开局额外获得一个命运宝箱[难2及以上可使用]：<br>
            <b @click="copy">{codes[0].code}</b><br><br>
            3. 使这局游戏你所有单位的伤害提升 10% [难4及以上可使用]：<br>
            <b @click="copy">{codes[3].code}</b><br><br>
            4. 隐藏英雄 - 影杀者<br>
            <b @click="copy">{codes[1].code}</b><br><br>
            5. 黑曜石 * 2 [难3及以上可使用]：<br>
            <b @click="copy">{codes[4].code}</b><br><br>
            - 福利码使用方法：<b>复制每点后面的代码，在游戏开始后在游戏聊天框中复制输入即可</b><br>
            - 以上福利码有效期截止 <b>{codes[0].end}</b>，届时会继续更新更多福利码。<br>
            - 如有特殊需求，可找群主开小灶哦~
        </div>
    </div>
    `,
    setup() {
        const codes = ref([]);

        function copy(content) {
            // content为要复制的内容
            // 创建元素用于复制
            const ele = document.createElement('input');
            // 设置元素内容
            ele.setAttribute('value', content);
            // 将元素插入页面进行调用
            document.body.appendChild(ele);
            // 复制内容
            ele.select();
            // 将内容复制到剪贴板
            document.execCommand('copy');
            // 删除创建元素
            document.body.removeChild(ele);
        }

        function fetchCodes() {
            fetch('https://palerock.cn/node-service/war3-wf-sys/wf/basic')
                .then(res => res.json())
                .then(res => {
                    codes.value = res || [];
                    console.log(res);
                });
        }

        fetchCodes();

        return {
            codes, copy: (e) => {
                copy(e.currentTarget.innerText.trim())
                alert('福利码复制成功！')
            }
        };
    }
}));
