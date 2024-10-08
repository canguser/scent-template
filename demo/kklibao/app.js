import { Reactivity, Scent } from './lib.js';
const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

window.Scent = Scent;

export const app = (window.p = defineComponent({
    components: { },
    template: `
        <div class='root-container'>
            <h2 class="slds-text-align_center slds-text-heading_large slds-m-bottom_xx-small">KK礼物网 - KKLiWu.xyz</h2>
            <h3 class="slds-text-align_center slds-text-heading_medium slds-m-bottom_small">本网站礼包码由互联网收集提供，致力做最全面且免费的礼包分享平台，觉得好用可Ctrl+D收藏哦。</h3>
            <!--<img src='./resources/lc.png' alt='' style='width: 800px;margin: 0 auto;display: block'>-->
            <div class="slds-form-element search-input">
              <div class="slds-form-element__control">
                <input type="text" placeholder="搜索地图" class="slds-input" />
              </div>
            </div>
            <div class='table-container'>
                <table class="slds-table slds-table_cell-buffer slds-table_bordered slds-table_col-bordered" aria-labelledby="element-with-table-label other-element-with-table-label">
                    <thead>
                    <tr class="slds-line-height_reset">
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包名称">礼包名称</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包兑换码">礼包兑换码</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包到期时间">礼包到期时间</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="礼包类型">礼包类型</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="详细介绍">详细介绍</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="领取方式">领取方式</div>
                    </th>
                    <th class="" scope="col">
                    <div class="slds-truncate" title="打开领取">打开领取</div>
                    </th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr s-for:item='gifts' class="slds-hint-parent">
                    <th data-label="礼包名称" scope="row">
                    <div class="slds-truncate" title="Cloudhub">
                    <a href="#" tabindex="-1">{item.name}</a>
                    </div>
                    </th>
                    <td data-label="礼包兑换码">
                    <div class="slds-truncate" title="Cloudhub">{item.code}</div>
                    </td>
                    <td data-label="礼包到期时间">
                    <div class="slds-truncate" title="4/14/2015">{item.end}</div>
                    </td>
                    <td data-label="Prospecting">
                    <div class="slds-truncate" title="Prospecting">{item.type}</div>
                    </td>
                    <td data-label="详细介绍">
                    <div class="slds-truncate" title="20%">{item.desc}</div>
                    </td>
                    <td data-label="领取方式">
                    <div class="slds-truncate" title="$25k"></div>
                    </td>
                    <td data-label="打开领取">
                    <div class="slds-truncate" title="jrogers@cloudhub.com">
                    <a href="#" tabindex="-1"></a>
                    </div>
                    </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <p class='text_center slds-m-top--large slds-text-color_weak'>拒绝盗版游戏 注意自我保护 谨防受骗上当 适度游戏益脑 沉迷游戏伤身 合理安排时间 享受健康生活 <br>
*注释：网站数据匀采集互联网，有不良信息举报联系我们，将会尽快核实处理 <br>
Copyright 2024-2024 All Rights Reserved.</p>
        </div>
    `,
    setup() {

        const gifts = ref([]);

        async function fetchGifts() {
            gifts.value = [
                {
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },{
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },{
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },{
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },{
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },{
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },{
                    name: '测试地图',
                    code: '123456',
                    mapId: '123456',
                    type: 'tCode', // pCode
                    desc: '在地图上方···中的兑换码处输入领取-地图等级1级可用',
                    start: '2021-01-01',
                    end: '2021-12-31',
                },
            ]
        }

        fetchGifts();

        return {
            gifts
        };
    }
}));
