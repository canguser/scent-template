import { generateMDL, generateMDX, parseMDL, parseMDX, Reactivity, Scent } from './lib.js';

const { defineComponent } = Scent;
const { reactive, computed, ref, toRaw } = Reactivity;

window.Scent = Scent;

// 遍历获得model对象中所有的Float32Array类型的属性以及key值,且length==3，且值都小于等于1大于等于0
function getAllColors(model, parentKey = []){
    const colors = [];
    for (const key in model) {
        const value = model[key];
        if (value instanceof Float32Array && value.length === 3 && value.every(v => v <= 1 && v >= 0)) {
            const fakeKey = '_'+key;
            if (!model[fakeKey]) {
                model['_'+key] = [...value]
            }
            colors.push({
                key: [...parentKey, key],
                value: model['_'+key],
                originValue: value
            });
        } else if (typeof value === 'object') {
            colors.push(...getAllColors(value, [...parentKey, key]));
        }
    }
    return colors;
}

function rgbToHexColor(rgb = [0,0,0]){
    return '#' + rgb.map(v => {
        const hex = Math.round(v * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexColorTorgb(hexColor){
    return hexColor.replace('#', '').match(/.{2}/g).map(v => parseInt(v, 16) / 255);
}

// 转化颜色为hsl, h: [0,360], s: [0,1], l: [0,1]
function rgbToHsl(rgb = [0,0,0]){
    const r = rgb[0] * 255;
    const g = rgb[1] * 255;
    const b = rgb[2] * 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 510;
    let h = 0;
    let s = 0;
    if (max !== min) {
        s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (510 - max - min);
        switch (max) {
            case r:
                h = (g - b) / (max - min);
                break;
            case g:
                h = 2 + (b - r) / (max - min);
                break;
            case b:
                h = 4 + (r - g) / (max - min);
                break;
        }
        h *= 60;
        if (h < 0) {
            h += 360;
        }
    }
    return [h, s, l];
}


function hslToRgb(hsl){
    var h = hsl[0] / 360;
    var s = hsl[1];
    var l = hsl[2];
    h = Math.max(h, 0)
    h = Math.min(h, 1)
    s = Math.max(s, 0)
    s = Math.min(s, 1)
    l = Math.max(l, 0)
    l = Math.min(l, 1)

    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];
}


function getItemByKeyPath(target, keyPath = []){
    for (let i = 0; i < keyPath.length; i++) {
        target = target[keyPath[i]];
    }
    return target;
}

export const app = (window.p = defineComponent({
    template:`
        <div class='root' @drop="readFile" @dragenter='preventEvent' @dragover='preventEvent'>
            <div style='display: flex;align-items: center;justify-content: center;flex-wrap: wrap'>
                <h1>MDX/MDL 模型颜色修改器</h1>
                <button style='margin-left: 10px' s-if='model' @click='exportModel'>另存为</button>
                <div style='width:100%;margin-left: 10px' s-if='!model' >
                    <h2 @click='exportModel' align='center'>(将MDX/MDL拖拽到该区域)</h2>
                </div>
            </div>
            <div s-if='model'>
                <!--hsl调整-->
                <div style='text-align: center'>
                    <h3>调整选中元素({checkedColors.length||'0'}个)颜色 <button @click='applyChanges'>应用</button></h3>
                    <table style='display: inline-block'>
                        <th>色相({h>=0?'+'+h:h})：</th>
                        <th>饱和度({s>=0?'+'+(s/100):(s/100)})：</th>
                        <th>亮度({l>=0?'+'+(l/100):(l/100)})：</th>
                        <tr>
                            <td><input type='number' min='-360' max='360' :value='h' @input='changeH'  ></td>
                            <td><input type='number' min='-100' max='100' :value='s' @input='changeS' ></td>
                            <td><input type='number' min='-100' max='100' :value='l'  @input='changeL' ></td>
                        </tr>
                        <tr>
                            <td><input type='range' min='-360' max='360' :value='h' @input='changeH'  ></td>
                            <td><input type='range' min='-100' max='100' :value='s' @input='changeS' ></td>
                            <td><input type='range' min='-100' max='100' :value='l'  @input='changeL' ></td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class='item-box'>
                <div class='item' s-for:item="colors">
                    <div>
                        <!--checkbox-->
                        <input type="checkbox" :value="item.checked" :checked="item.checked" @change='e=>checked(item, e.target.checked)'>
                        <label>
                            <p>{item.label}</p>
                            <input type="color" :value="item.color" @input='e=>setColor(item, e.target.value)'>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const isMDX = ref(false)
        const model = ref(null)
        const modelName = ref('')
        const checkedPath = reactive([])
        // hcl 变量
        const h = ref(0)
        const s = ref(0)
        const l = ref(0)
        const colors = computed(() => {
            if (model.value) {
                return getAllColors(model.value)
                    .map(c=>{
                        const label = c.key.join('.')
                        const fakeKey = [...c.key]
                        const key = fakeKey.pop()
                        fakeKey.push('_'+key)
                        const fakeLabel = fakeKey.join('.')
                        return {
                            ...c,
                            label,
                            fakeKey,
                            fakeLabel,
                            color: rgbToHexColor(c.value),
                            checked: checkedPath.includes(fakeLabel)
                        }
                    })
                    .filter(c=>c.label.toLowerCase().indexOf('color') > -1);
            } else {
                return [];
            }
        })
        const checkedColors = computed(() => {
            return colors.value.filter(c=>c.checked);
        })
        function refreshCheckedPath(){
            checkedColors.value.forEach((color)=>{
                const hsl = rgbToHsl(color.originValue)
                const value = hslToRgb([h.value + hsl[0], (s.value / 100) + hsl[1], (l.value / 100) + hsl[2]])
                let target = getItemByKeyPath(toRaw(model.value), color.fakeKey);
                target[0] = value[0];
                target[1] = value[1];
                target[2] = value[2];
            })
            model.value = { ...model.value }
        }
        function applyChanges(){
            checkedColors.value.forEach((color)=>{
                let fakeTarget = getItemByKeyPath(toRaw(model.value), color.fakeKey);
                let target = getItemByKeyPath(toRaw(model.value), color.key);
                target[0] = fakeTarget[0];
                target[1] = fakeTarget[1];
                target[2] = fakeTarget[2];
            })
            model.value = { ...model.value }
            h.value = 0
            s.value = 0
            l.value = 0
            checkedPath.splice(0)
        }
        function cancelChanges(item){
            let fakeTarget = getItemByKeyPath(toRaw(model.value), item.fakeKey);
            let target = getItemByKeyPath(toRaw(model.value), item.key);
            fakeTarget[0] = target[0];
            fakeTarget[1] = target[1];
            fakeTarget[2] = target[2];
            model.value = { ...model.value }
        }
        return {
            colors, model, checkedColors,h,s,l,applyChanges,
            exportModel(){
                const res = new Blob(isMDX.value?[generateMDX(toRaw(model.value))]:[generateMDL(toRaw(model.value))], {type: 'octet/stream'});
                const link = document.createElement('a');
                link.style.display = 'none';
                document.body.appendChild(link);
                link.href = URL.createObjectURL(res);
                link.download = modelName.value;
                link.click();
                URL.revokeObjectURL(link.href);
                document.body.removeChild(link);
            },
            readFile(e){
                console.log(e)
                e.preventDefault()
                const file = event.dataTransfer.files && event.dataTransfer.files[0];
                if (!file) {
                    return;
                }

                const reader = new FileReader();
                isMDX.value = file.name.indexOf('.mdx') > -1;
                modelName.value = file.name;

                reader.onload = () => {
                    try {
                        if (isMDX.value) {
                            model.value = parseMDX(reader.result);
                        } else {
                            model.value = parseMDL(reader.result);
                        }
                    } catch (err) {
                        console.log(err)
                        return;
                    }
                };

                if (isMDX) {
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.readAsText(file);
                }

            },
            preventEvent(e){
                e.preventDefault()
                e.stopPropagation()
            },
            setColor(item, color){
                color = hexColorTorgb(color);
                const rawModel = toRaw(model.value);
                // set keyPath color
                let target = getItemByKeyPath(rawModel, item.key);
                target[0] = color[0];
                target[1] = color[1];
                target[2] = color[2];
                let fakeTarget = getItemByKeyPath(rawModel, item.fakeKey);
                fakeTarget[0] = color[0];
                fakeTarget[1] = color[1];
                fakeTarget[2] = color[2];
                model.value = { ...rawModel };
            },
            checked(item, checked){
                if (checked) {
                    checkedPath.push(item.fakeLabel);
                }
                else {
                    checkedPath.splice(checkedPath.indexOf(item.fakeLabel, 1));
                    cancelChanges(item);
                }
            },
            changeH(e){
                h.value = parseInt(e.target.value) || 0;
                e.target.value = h.value;
                refreshCheckedPath();
            },
            changeS(e) {
                s.value = (parseFloat(e.target.value) || 0);
                e.target.value = h.value || undefined;
                refreshCheckedPath();
            },
            changeL(e) {
                l.value = (parseFloat(e.target.value) || 0);
                e.target.value = h.value || undefined;
                refreshCheckedPath();
            }
        }
    }
}));
