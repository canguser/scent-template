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

function wrapText(text, colorStr, defaultColor = '|cff000000') {
    if (!colorStr) {
        return text;
    }
    const hex = rgba2Hex(colorStr);
    if (hex.toLowerCase() === defaultColor) {
        return text;
    }
    return `${rgba2Hex(colorStr)}${text}|r`;
}

export function convertColor(dom, defaultColor = '|cff000000') {
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
                        console.log('match start');
                        result += wrapText(text, color, defaultColor);
                        if (toMatch === text) {
                            console.log('match send');
                            index++;
                        }
                        break;
                    }
                    if (toMatch.indexOf(text) > 0) {
                        console.log('match continue');
                        result += wrapText(text, color, defaultColor);
                        const indexOfText = toMatch.indexOf(text);
                        if (toMatch.slice(indexOfText) === text) {
                            console.log('match cend');
                            index++;
                        }
                        break;
                    }
                    index++;
                }
            }
        }
    });
    return result;
}

export function convertFromColor(colorStr) {
    const reg = /\|c[0-9A-F]{8}/gi;
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
