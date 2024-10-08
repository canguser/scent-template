import { Reactivity, Scent } from './lib.js';
import { basicModal } from './components/basic-modal.js';
const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

window.Scent = Scent;

export const app = (window.p = defineComponent({
    components: {basicModal },
    template: `
        <div class='root-container'>
            <h2 class="slds-text-align_center slds-text-heading_large slds-m-bottom_xx-small">KK礼物网 - KKLiWu.xyz</h2>
            <h3 class="slds-text-align_center slds-text-heading_medium slds-m-bottom_small">本网站礼包码由互联网收集提供，致力做最全面且免费的礼包分享平台，觉得好用可Ctrl+D收藏哦。</h3>
            <div class="slds-form-element search-input">
              <div class="slds-form-element__control">
                <input type="text" s-model='keywords' placeholder="搜索地图" class="slds-input" />
              </div>
            </div>
            <div class='table-container'>
                <table class="slds-table slds-table_cell-buffer slds-table_bordered slds-table_col-bordered" aria-labelledby="element-with-table-label other-element-with-table-label">
                    <thead>
                    <tr class="slds-line-height_reset">
                    <th class="" scope="col">
                    <div class="slds-truncate" title="热度">热度</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包名称">礼包名称</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包兑换码">
                        礼包兑换码
                    </div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包到期时间">礼包码有效时间</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包类型">礼包类型</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="详细介绍">详细介绍</div>
                    </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr s-for:item='gifts' class="slds-hint-parent">
                    <td data-label="热度">
                    <div class="slds-truncate" :title="item.hot">{item.hotEmoji}</div>
                    </td>
                    <th data-label="礼包名称" scope="row">
                    <div class="slds-truncate" :title="'点击在kk对中平台中打开：'+item.name">
                    <a :href="item.openLink" tabindex="-1">{item.name}</a>
                    </div>
                    </th>
                    <td data-label="礼包兑换码">
                    <div class="slds-truncate" :title="'点击复制:' + item.code" @click='copyCode(item)'><a class='slds-button'>[复制] {item.code}</a></div>
                    </td>
                    <td data-label="礼包有效期">
                    <div class="slds-truncate" :title="item.end">{item.end}</div>
                    </td>
                    <td data-label="Prospecting">
                    <div class="slds-truncate" :title="item.type">{item.type}</div>
                    </td>
                    <td data-label="详细介绍">
                    <div class="slds-truncate" :title="item.desc">{item.desc}</div>
                    </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <p class='text_center slds-m-top--large slds-text-color_weak'>拒绝盗版游戏 注意自我保护 谨防受骗上当 适度游戏益脑 沉迷游戏伤身 合理安排时间 享受健康生活 <br>
*注释：网站数据匀采集互联网，有不良信息举报联系我们，将会尽快核实处理 <br>
Copyright 2024-2024 All Rights Reserved.</p>
        </div>
        <basic-modal ref="tipModal" :is-open="!!copyModalItem">
            <div slot="header">复制成功</div>
            <div class="slds-text-align_center modal-tips">
                <img src='./resources/lc.png' alt='' style='width: 800px;margin: 0 auto;display: block'>
            </div>
            <div slot="footer" class="slds-grid slds-grid--align-center">
                <button class="slds-button slds-button_neutral" @click="copyModalItem=null">等会儿使用</button>
                <button class="slds-button slds-button_brand" @click="navigateKK">打开KK平台粘贴</button>
            </div>
        </basic-modal>
        
    `,
    setup() {

        const gifts = ref([]);
        const keywords = ref('');
        const copyModalItem = ref(null);

        const showGifts = computed(() => {
            const g = gifts.value;

            // sort by hot
            g.sort((a, b) => b.hot - a.hot);

            return g
                .filter(gift => gift.end > Date.now() && gift.name.includes(keywords.value))
                .map((gift, i) => {
                    const end = parseInt((gift.end - Date.now()) / (1000 * 3600 * 24))
                    const base64 = btoa('mapid=' + gift.mapId)
                    return {
                    ...gift,
                    name: gift.name + ({ tCode: ' - 新人礼包', pCode: ' - 平台礼包' })[gift.type],
                    desc: ({tCode: '在地图上方···中的兑换码处输入领取-地图等级1级可用', pCode: '在平台右上角更多中兑换码礼包处领取 -推荐'})[gift.type] || gift.desc || '其他礼包',
                    type: ({ tCode: '新人礼包', pCode: '平台礼包' })[gift.type] || '其他礼包',
                    code: gift.code,
                    end: end > 0 ? (end+ '天后过期'):'明天过期',
                    start: new Date(gift.start).toLocaleDateString(),
                    hotEmoji: '🔥'.repeat(Math.max(1,parseInt(gift.hot / 5000))),
                    openLink: `kkduizhan://viewmap?${base64}`
                };
            });

        });

        async function fetchGifts() {
            gifts.value = (await fetch('https://palerock.cn/node-service/kk/tgs').then(res => res.json())).filter(gift => gift.end > Date.now());
        }

        fetchGifts();

        function copyToClipboard(text) {
            const input = document.createElement('input')
            input.style.position = 'fixed'
            input.style.opacity = 0
            input.value = text
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
        }

        function copyCode(item){
            copyToClipboard(item.code)
            copyModalItem.value = item
        }

        return {
            gifts:showGifts,
            keywords,
            copyCode,
            copyModalItem,
            navigateKK(){
                const url = copyModalItem.value.openLink
                const a = document.createElement('a')
                a.href = url
                a.target = '_blank'
                a.click()
                copyModalItem.value = null
            }
        };
    }
}));
