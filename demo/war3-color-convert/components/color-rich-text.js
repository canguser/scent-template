import { $_, Reactivity, Scent } from '../lib.js';
import { convertColor, traversingTreeNode } from '../color-convert.js';

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
            <textarea name="test" id="" cols="30" rows="10" s-model="textValue" readonly></textarea>
        </div>
        {watchValue}
    </div>
    
    `,
    setup(props, instance) {
        const value = toRef(props, 'value');
        const colorHistories = reactive([]);
        const richTextHistory = [];
        const rollbackHistory = [];
        const richText = ref('');
        const textValue = ref('');

        function setRichText() {
            const div = instance.target.querySelector('.color-display-box');
            const originHtml = richText.value;
            if (originHtml !== div.innerHTML) {
                richText.value = div.innerHTML;
                richTextHistory.push(originHtml);
                rollbackHistory.splice(0);
                textValue.value = convertColor(div, '|cffffffff');
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
                // console.log('wwwupdatevalue', div.innerHTML);
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
                        if (node === frontNode && node !== backNode) {
                            // console.log(frontOffset);
                            const keepText = text.slice(0, frontOffset);
                            const changeText = text.slice(frontOffset);
                            node.textContent = keepText;
                            appendAfter(createDom(`<span style="color: ${color}">${changeText}</span>`), node);
                        } else if (node === backNode && node !== frontNode) {
                            const keepText = text.slice(backOffset);
                            const changeText = text.slice(0, backOffset);
                            node.textContent = keepText;
                            node.parentNode.insertBefore(
                                createDom(`<span style="color: ${color}">${changeText}</span>`),
                                node
                            );
                        } else if (node === backNode && node === frontNode) {
                            const keepText = text.slice(0, frontOffset);
                            const keepText2 = text.slice(backOffset);
                            const changeText = text.slice(frontOffset, backOffset);
                            const beforeNode = node.cloneNode(true)
                            beforeNode.textContent = keepText;
                            const afterNode = node.cloneNode(true)
                            afterNode.textContent = keepText2;
                            node.parentNode.insertBefore(beforeNode, node)
                            appendAfter(afterNode, node)
                            node.parentNode.insertBefore(
                                createDom(`<span style="color: ${color}">${changeText}</span>`),
                                node
                            );
                            // remove node
                            node.parentNode.removeChild(node);
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
            textValue,
            colorHistories,
            richText,
            watchValue,
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