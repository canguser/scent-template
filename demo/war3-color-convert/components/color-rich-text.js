import { Reactivity, Scent } from '../lib.js';
import { convertColor, traversingTreeNode } from '../color-convert.js';

const { defineComponent } = Scent;
const { reactive, computed, ref } = Reactivity;

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

var $_ = (function (exports) {
    'use strict';

    function neverPromise() {
        return new Promise(() => undefined);
    }

    const defaultContext = {};
    function debounce(duringOrOptions = 200) {
        const debounceOptions = typeof duringOrOptions === 'number' ? { during: duringOrOptions } : duringOrOptions;
        const {
            leading = false,
            during = 200,
            context = defaultContext,
            uniqueApi = 'defaultApi',
            callback = () => undefined
        } = debounceOptions;
        const eqName = `_debounce_${uniqueApi}`;
        if (!leading) {
            clearTimeout(context[eqName]);
        }
        if (!leading || !context[eqName]) {
            return new Promise((resolve) => {
                context[eqName] = setTimeout(() => {
                    context[eqName] = undefined;
                    resolve(callback());
                }, during);
            });
        } else {
            return neverPromise();
        }
    }

    exports.debounce = debounce;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;
})({});

export const colorRichText = defineComponent({
    name: 'color-show',
    template: `
    <div class="display-flex flex-justify_center">
        <div @keydown="onkeydown" class="left-box" >
            <div class="color-display-box"  s-html="richText" contenteditable="true" @blur="onblur">
            </div>
            <div class="color-pickup-box">
                <input class="color-pickup" type="color" @input="setCurrentColor">
                <div class="color-pickup-item" s-for:item="colorHistories" @mousedown="e=>preventEvent(e)" @click="e=>setHistory(e,item)" :style="{backgroundColor: item}"></div>
            </div>
        </div>
        <div class="right-box">
            <textarea name="test" id="" cols="30" rows="10" s-model="value" readonly></textarea>
        </div>
    </div>
    
    `,
    setup(props, instance) {
        const colorHistories = reactive([]);
        const richTextHistory = [];
        const rollbackHistory = [];
        const richText = ref('');
        const value = ref('');
        function setRichText() {
            const div = instance.target.querySelector('.color-display-box');
            const originHtml = richText.value;
            if (originHtml !== div.innerHTML) {
                richText.value = div.innerHTML;
                richTextHistory.push(originHtml);
                rollbackHistory.splice(0);
            }
            instance.nextTick(() => {
                value.value = convertColor(div, '|cffffffff');
            });
        }
        function rollback() {
            if (richTextHistory.length === 0) {
                return false;
            }
            rollbackHistory.push(richText.value);
            richText.value = richTextHistory.pop();
            instance.nextTick(() => {
                value.value = convertColor(instance.target.querySelector('.color-display-box'), '|cffffffff');
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
                value.value = convertColor(instance.target.querySelector('.color-display-box'), '|cffffffff');
            });
            return true;
        }
        function setColor(color) {
            $_.debounce(200).then(() => {
                if (colorHistories.includes(color)) {
                    colorHistories.splice(colorHistories.indexOf(color), 1);
                }
                colorHistories.unshift(color);
                if (colorHistories.length > 10) {
                    colorHistories.pop();
                }
            });
            const selection = getSelection();
            // console.log(selection);
            const text = selection.toString();
            if (!text) {
                return;
            }
            const anchorNode = selection.anchorNode;
            const focusNode = selection.focusNode;
            const anchorFrontier = anchorNode.compareDocumentPosition(focusNode) & Node.DOCUMENT_POSITION_FOLLOWING;
            const frontNode = anchorNode === focusNode ? anchorNode : anchorFrontier ? anchorNode : focusNode;
            const frontOffset =
                anchorNode === focusNode
                    ? selection.anchorOffset > selection.focusOffset
                        ? selection.focusOffset
                        : selection.anchorOffset
                    : anchorFrontier
                    ? selection.anchorOffset
                    : selection.focusOffset;
            const backNode = anchorNode === focusNode ? focusNode : anchorFrontier ? focusNode : anchorNode;
            const backOffset =
                anchorNode === focusNode
                    ? selection.anchorOffset < selection.focusOffset
                        ? selection.focusOffset
                        : selection.anchorOffset
                    : anchorFrontier
                    ? selection.focusOffset
                    : selection.anchorOffset;

            traversingTreeNode(instance.target.querySelector('.color-display-box'), 'childNodes', (node) => {
                if (node.nodeType === Node.TEXT_NODE && node.parentNode.nodeType !== Node.COMMENT_NODE) {
                    if (selection.containsNode(node)) {
                        const text = node.textContent;
                        if (node === frontNode) {
                            // console.log(frontOffset);
                            const keepText = text.slice(0, frontOffset);
                            const changeText = text.slice(frontOffset);
                            node.textContent = keepText;
                            appendAfter(createDom(`<span style="color: ${color}">${changeText}</span>`), node);
                        } else if (node === backNode) {
                            const keepText = text.slice(backOffset);
                            const changeText = text.slice(0, backOffset);
                            node.textContent = keepText;
                            node.parentNode.insertBefore(
                                createDom(`<span style="color: ${color}">${changeText}</span>`),
                                node
                            );
                        } else {
                            node.parentNode.replaceChild(
                                createDom(`<span style="color: ${color}">${text}</span>`),
                                node
                            );
                        }
                    }
                }
            });

            setRichText();
        }
        return {
            value,
            colorHistories,
            richText,
            setCurrentColor(e) {
                setColor(e.target.value);
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
            onblur(){
                console.log(getSelection());
            },
            preventEvent(e){
                e.preventDefault()
                e.stopPropagation()
            }
        };
    }
});
