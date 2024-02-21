import { $_, Reactivity, Scent } from '../lib.js';
import { ColorString, convertColor, traversingTreeNode } from '../color-convert.js';

const { defineComponent } = Scent;
const { reactive, computed, ref, toRef } = Reactivity;

function appendAfter(newDom, dom) {
    const parent = dom.parentNode;
    if (parent) {
        parent.insertBefore(newDom, dom.nextSibling);
    }
    // if only one child
    if (parent && parent.childNodes.length === 1) {
        parent.appendChild(newDom);
    }
}

function createDom(html) {
    const dom = document.createElement('template');
    dom.innerHTML = html;
    return dom.content;
}

function findParent(node, className){
    while(node && (node.nodeType === Node.TEXT_NODE || !node.classList ||  !node.classList.contains(className))){
        node = node.parentNode;
    }
    return node;
}

function getMatchSizeIgnoreReturn(all, start){
    const parts = all.split(/\n/g);
    let length = 0, index = 0;
    for (let i = 0; i < parts.length; i++) {
        length += parts[i].length;
        if(start.length > length){
            index += 1;
        }
    }
    return index + start.length;
}

// 保存当前光标在目标dom中的选中下标
function saveSelection(dom) {
    const selection = getSelection();
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(dom);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const content = findParent(range.startContainer, 'color-display-box').innerText
    const start = getMatchSizeIgnoreReturn(content, preSelectionRange.toString());
    return {
        start,
        end: start + selection.toString().length
    };
}

// 恢复当前光标的选中区间
function restoreSelection(dom, range) {
    try {
        // console.log('restoreSelection', range)
        const selection = getSelection();
        const rangeObj = document.createRange();
        rangeObj.setStart(dom, range.start);
        rangeObj.setEnd(dom, range.end);
        selection.removeAllRanges();
        selection.addRange(rangeObj);
    }catch (e){
        console.warn('restoreSelection warning', e);
    }
}

export const colorRichText = defineComponent({
    name: 'color-show',
    template: `
    <div class="display-flex flex-justify_center">
        <div @keydown="onkeydown" class="left-box" >
            <div class="color-display-box"  s-html="richText" contenteditable="true" @blur="onblur">
            </div>
            <div class="out-color">
                <div class="color-pickup-box">
                    <input class="color-pickup" type="color" @input="setCurrentColor" @value="currentColor">
                    <div class="color-pickup-item" s-for:item="colorHistories" @mousedown="e=>preventEvent(e)" @click="e=>setHistory(e,item)" :style="{backgroundColor: item}"></div>
                </div>
                <div class="color-pickup-box">
                    <input class="color-pickup" type="color" @input="setEndColor">
                    <div class="color-pickup-item" s-for:item="endColorHistories" @mousedown="e=>preventEvent(e)" @click="e=>setEndHistory(e,item)" :style="{backgroundColor: item}"></div>
                </div>
            </div>
        </div>
        <div class="right-box">
            <textarea name="test" id="" cols="30" rows="10" s-model="textValue" readonly></textarea>
        </div>
        {watchValue}
    </div>
    
    `,
    setup(props, instance) {
        const value = toRef(props, 'value');
        const colorHistories = reactive([]);
        const endColorHistories = reactive([]);
        const richTextHistory = [];
        const rollbackHistory = [];
        const richText = ref('');
        const textValue = ref('');
        const currentColor = ref('#ffffff');

        function setRichText(tValue) {
            const div = instance.target.querySelector('.color-display-box');
            const originHtml = richText.value;
            if (originHtml !== div.innerHTML || (tValue && tValue !== textValue.value)) {
                if (tValue) {
                    textValue.value = tValue;
                }else{
                    textValue.value = convertColor(div, '|cffffffff');
                }
                const range = saveSelection(div);
                div.innerHTML = new ColorString(textValue.value, '|cffffffff').toHtml();
                restoreSelection(div, range);
                richText.value = div.innerHTML;
                richTextHistory.push(originHtml);
                rollbackHistory.splice(0);
                console.log(textValue.value);
                $_.debounce(100).then(() => {
                    instance.target.dispatchEvent(
                        new CustomEvent('updatevalue', {
                            detail: {
                                value: richText.value,
                                code: textValue.value
                            }
                        })
                    );
                });
            }
        }

        const watchValue = computed(() => {
            const { value: htmlValue } = value;
            const div = instance.target.querySelector('.color-display-box');
            if (div && htmlValue !== div.innerHTML) {
                // console.log('wwwupdatevalue', htmlValue);
                div.innerHTML = htmlValue;
                $_.debounce(100).then(() => {
                    setRichText();
                });
            }
        });

        function rollback() {
            if (richTextHistory.length === 0) {
                return false;
            }
            rollbackHistory.push(richText.value);
            richText.value = richTextHistory.pop();
            instance.nextTick(() => {
                textValue.value = convertColor(instance.target.querySelector('.color-display-box'), '|cffffffff');
            });
            return true;
        }
        function forward() {
            if (rollbackHistory.length === 0) {
                return false;
            }
            richTextHistory.push(richText.value);
            richText.value = rollbackHistory.pop();
            instance.nextTick(() => {
                textValue.value = convertColor(instance.target.querySelector('.color-display-box'), '|cffffffff');
            });
            return true;
        }
        function getNodeIndexOfParent(node){
            let index = 0;
            while(node = node.previousSibling){
                index++;
            }
            return index;
        }
        function setColor(color, endColor) {
            $_.debounce(200).then(() => {
                if (colorHistories.includes(color)) {
                    colorHistories.splice(colorHistories.indexOf(color), 1);
                }
                colorHistories.unshift(color);
                if (colorHistories.length > 10) {
                    colorHistories.pop();
                }
                if (endColor){
                    if (endColorHistories.includes(endColor)) {
                        endColorHistories.splice(endColorHistories.indexOf(endColor), 1);
                    }
                    endColorHistories.unshift(endColor);
                    if (endColorHistories.length > 10) {
                        endColorHistories.pop();
                    }
                }
            });
            const selection = getSelection();
            const text = selection.toString();
            if (!text) {
                return;
            }
            restoreSelection(instance.target.querySelector('.color-display-box'), saveSelection(instance.target.querySelector('.color-display-box')));
            const hasOffset = selection.anchorOffset !== selection.focusOffset;
            let startI = hasOffset ? selection.anchorOffset : getNodeIndexOfParent(selection.anchorNode.parentNode);
            let endI = hasOffset ? selection.focusOffset : getNodeIndexOfParent(selection.focusNode.parentNode);
            const lowI = startI > endI ? endI : startI;
            const highI = startI > endI ? startI : endI;

            const cStr = new ColorString(textValue.value, '|cffffffff');
            if (endColor){
                cStr.wrapStepColor(lowI, highI+(hasOffset?0:1), color.replace('#', 'ff'), endColor.replace('#', 'ff'));
            }else{
                cStr.wrapColor(lowI, highI+(hasOffset?0:1), color.replace('#', 'ff'));
            }
            setRichText(cStr.toHex());
        }
        return {
            textValue,
            colorHistories,
            endColorHistories,
            currentColor,
            richText,
            watchValue,
            setCurrentColor(e) {
                currentColor.value = e.target.value;
                setColor(e.target.value);
            },
            setEndColor(e) {
                setColor(currentColor.value, e.target.value);
            },
            onkeydown(e) {
                // if is ctrl + z or cmd + z but not shift + z
                if ((e.ctrlKey || e.metaKey) && e.keyCode === 90 && !e.shiftKey) {
                    if (rollback()) {
                        console.log(e);
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }
                // if is ctrl + shift + z or cmd + shift + z
                if ((e.ctrlKey || e.metaKey) && e.keyCode === 90 && e.shiftKey) {
                    if (forward()) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                }
                $_.debounce(500).then(() => {
                    setRichText();
                });
            },
            setHistory(e, item) {
                setColor(item);
            },
            setEndHistory(e, item) {
                setColor(currentColor.value, item);
            },
            onblur() {
                // console.log(getSelection());
            },
            preventEvent(e) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
    }
});
