export function traversingTreeNode(treeNode, childProperty, callback, { parentNode, avoidModify = true } = {}) {
    if (!treeNode) {
        return;
    }
    let childNodes;
    if (avoidModify) {
        childNodes = [...treeNode[childProperty]];
    }
    const callbackResult = callback(treeNode, parentNode);
    const continueTraversing = callbackResult !== false;
    if (continueTraversing) {
        if (!childNodes) {
            childNodes = treeNode[childProperty];
        }
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                traversingTreeNode(childNodes[i], childProperty, callback, {
                    parentNode: treeNode,
                    avoidModify
                });
            }
        }
    }
}

function rgba2Hex(colorStr, prefix = '|c') {
    const reg = /^\s*rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,?\s*(0|1|0.\d+))?\s*\)\s*$/i;
    const [, r = '255', g = '255', b = '255', , a = '1'] = colorStr.match(reg) || [];
    // console.log(colorStr.match(reg))
    return (
        prefix +
        parseInt(parseFloat(a || 1) * 255)
            .toString(16)
            .toUpperCase()
            .padStart(2, '0') +
        parseInt(r || 255, 10)
            .toString(16)
            .toUpperCase()
            .padStart(2, '0') +
        parseInt(g || 255, 10)
            .toString(16)
            .toUpperCase()
            .padStart(2, '0') +
        parseInt(b || 255, 10)
            .toString(16)
            .toUpperCase()
            .padStart(2, '0')
    );
}

function hex2rgba(hex) {
    const reg = /(\|c|#)([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i;
    const [, , a = 'FF', r = 'FF', g = 'FF', b = 'FF'] = hex.match(reg);
    return `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)},${(parseInt(a, 16) / 255).toFixed(3)})`;
}

function wrapText(text, colorStr, defaultColor = '|cffffffff') {
    if (!colorStr) {
        return text;
    }
    const hex = rgba2Hex(colorStr);
    if (hex.toLowerCase() === defaultColor) {
        return text;
    }
    return `${rgba2Hex(colorStr)}${text}|r`;
}

function getColorTextInfos(colorText){
    const reg = /\|c[\dA-F]{8}/gi;
    // colorText = colorText.replace(/\s/g, '&nbsp').replace(/</g, '&lt').replace(/>/g, '&gt').replace(/\n/g, '');
    const colors = colorText.match(reg) || [];
    const colorSplits = colorText.split(reg);
    // console.log(colors, colorSplits);
    const results = [];
    colorSplits.forEach((split, index) => {
        if (split !== '') {
            const colorIndex = index - 1;
            const color = colors[colorIndex];
            const elementStr = split
                .split('|r')
                .map((text, i, all) => {
                    // console.log(all);
                    if (i === 0 && color && all.length > 1) {
                        return {
                            color,
                            text
                        };
                    }
                    return {
                        text
                    };
                })
            results.push(...elementStr);
        }
    });
    return results
}

function mergeSameColor(text){
    const validTexts = getColorTextInfos(text).filter(text=>text.text !== '')
    let lastColor = '';
    const results = []
    for(let i = 0; i < validTexts.length; i++){
        const text = validTexts[i];
        if(text.color === lastColor){
            results[results.length - 1].text += text.text;
        }else{
            results.push(text);
            lastColor = text.color;
        }
    }
    return results.map(text=>text.color ? `${text.color}${text.text}|r` : text.text).join('')
}

export function convertColor(dom, defaultColor = '|cffffffff') {
    const originText = dom.innerText;
    const splitByReturn = originText.split('\n');
    console.log(splitByReturn);
    let index = 0;
    let result = '';

    traversingTreeNode(dom, 'childNodes', (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.parentNode.nodeType !== Node.COMMENT_NODE) {
            const text = node.textContent;
            const { color } = getComputedStyle(node.parentNode) || {};

            if (text != null && text !== '') {
                let hasSpace = false;
                while (index < splitByReturn.length) {
                    const toMatch = splitByReturn[index];
                    // console.log('index', index);
                    // console.log('toMatch', toMatch);
                    // console.log('text', text);
                    if (toMatch === '') {
                        index++;
                        result += '|n';
                        hasSpace = true;
                        continue;
                    }
                    if (toMatch.indexOf(text) === 0) {
                        let isFirstNotEmptyLine = true;
                        for (let i = 0; i < index; i++) {
                            isFirstNotEmptyLine = isFirstNotEmptyLine && splitByReturn[i] === '';
                        }
                        if (!isFirstNotEmptyLine) {
                            // console.log('match |n newLine');
                            result += '|n';
                        }
                        // console.log('match start');
                        result += wrapText(text, color, defaultColor);
                        splitByReturn[index] = toMatch.slice(text.length);
                        // console.log('splitByReturn[index]', splitByReturn[index]);
                        if (toMatch === text) {
                            if (index < splitByReturn.length - 1) {
                                result += '|n';
                            }
                            // console.log('match send');
                            index++;
                        }
                        break;
                    }
                    index++;
                }
            }
        }
    });
    result = result.replace(/ /g, ' ');
    console.log('result', result);
    // 将同样颜色区域合并
    return mergeSameColor(result);
}

export function escapeHtml(text) {
    return text.replace(/</g, '&lt').replace(/>/g, '&gt').replace(/\n/g, '<br/>').replace(/\|n/g, '<br/>').replace(/\s/g, '&nbsp')
}

export function convertFromColor(colorStr) {
    const reg = /\|c[\dA-F]{8}/gi;
    colorStr = colorStr.replace(/\s/g, '&nbsp').replace(/</g, '&lt').replace(/>/g, '&gt').replace(/\n/g, '');
    const colors = colorStr.match(reg) || [];
    const colorSplits = colorStr.split(reg);
    // console.log(colors, colorSplits);
    const results = [];
    colorSplits.forEach((split, index) => {
        if (split !== '') {
            const colorIndex = index - 1;
            const color = colors[colorIndex];
            const elementStr = split
                .split('|r')
                .map((text, i, all) => {
                    // console.log(all);
                    if (i === 0 && color && all.length > 1) {
                        return `<span style="color: ${hex2rgba(color)}">${text}</span>`;
                    }
                    return `<span>${text}</span>`;
                })
                .join('');
            results.push(elementStr.replace(/\|n/g, '<br/>'));
        }
    });
    // console.log(results.join(''));
    return results.join('');
}

export class Color {
    r = 0;
    g = 0;
    b = 0;
    a = 1;

    constructor(r, g, b, a = 1) {
        this.r = parseInt(r);
        this.g = parseInt(g);
        this.b = parseInt(b);
        this.a = a;
    }

    static fromHex(hex) {
        const reg = /(\|c|#|)([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i;
        const [, , a = 'ff', r = 'ff', g = 'ff', b = 'ff'] = hex.match(reg);
        return new Color(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), parseInt(a, 16) / 255);
    }

    static fromRgba(rgba) {
        const reg = /^\s*rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,?\s*(0|1|0.\d+))?\s*\)\s*$/i;
        const [, r = '255', g = '255', b = '255', , a = '1'] = rgba.match(reg) || [];
        return new Color(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10), parseFloat(a || 1));
    }

    get aHex(){
        return parseInt(this.a * 255).toString(16).padStart(2, '0')
    }

    toHex() {
        return `${parseInt(this.a * 255).toString(16).padStart(2, '0')}${this.r.toString(16).padStart(2, '0')}${this.g.toString(16).padStart(2, '0')}${this.b.toString(16).padStart(2, '0')}`;
    }

    toRgba() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }

    wrapTextWithHex(text) {
        if (text === '\n' || text === '|n'){
            return '|n'
        }
        return `|c${this.toHex()}${text}|r`;
    }

    wrapTextWithHtml(text) {
        if (text === '\n'){
            return '<br/>'
        }
        return `<span style="color: ${this.toRgba()}">${escapeHtml(text)}</span>`;
    }

    stepToColor(endColor, step){
        const result = []
        for (let i = 1; i <= step; i++){
            const r = this.r + (endColor.r - this.r) * i / step
            const g = this.g + (endColor.g - this.g) * i / step
            const b = this.b + (endColor.b - this.b) * i / step
            const a = this.a + (endColor.a - this.a) * i / step
            result.push(new Color(r, g, b, a))
        }
        return result
    }
}

export class ColorString {

    values = [];
    defaultColor = '|cffffffff';

    constructor(colorStr, defaultColor = '|cffffffff') {
        this.defaultColor = defaultColor;
        const infos = getColorTextInfos(colorStr).filter(info=>info.text.trim())
        infos.forEach(info=>{
            const chars = info.text.replace(/\|n/g, '\n').split('')
            const color = Color.fromHex(info.color || defaultColor)
            chars.forEach(char=>{
                this.values.push({char, color})
            })
        })
    }

    setColor(index, color){
        color = (color instanceof Color) ? color : Color.fromHex(color)
        if (this.values[index]){
            this.values[index].color = color
        }
    }

    wrapColor(start, end, color){
        color = (color instanceof Color) ? color : Color.fromHex(color)
        for(let i = start; i < end; i++){
            this.values[i].color = color
        }
    }

    wrapStepColor(start, end, color, endColor){
        color = (color instanceof Color) ? color : Color.fromHex(color)
        endColor = (endColor instanceof Color) ? endColor : Color.fromHex(endColor)
        const colors = color.stepToColor(endColor, end - start - 1)
        // console.log(colors)
        this.setColor(start, color)
        for (let i = 0; i < colors.length; i++){
            this.setColor(i + start + 1, colors[i])
        }
    }

    plainText(){
        return this.values.map(info=>info.char).join('')
    }

    toHex(){
        return mergeSameColor(this.values.map(info=>{
            if (info.color.toHex() === Color.fromHex(this.defaultColor).toHex()){
                return info.char
            }
            return info.color.wrapTextWithHex(info.char)
        }).join(''))
    }

    toHtml(){
        return this.values.map(info=>info.color.wrapTextWithHtml(info.char)).join('')
    }
}