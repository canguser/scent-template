export function getAllElements(ele: Element): Element[] {
    return [ele].concat([...(ele.children || [])].map((e) => getAllElements(e)).flat());
}

export function getAllNodes(ele: Element): Node[] {
    return ([ele] as Node[]).concat([...(ele.childNodes || [])].map((e) => getAllNodes(e as Element)).flat());
}

export function inDocument(node: Node) {
    if (node instanceof Document) {
        return true;
    }
    if (!node.parentNode) {
        return false;
    }
    return inDocument(node.parentNode);
}

export function replaceCommonNode(node, comment: string) {
    const commentNode = document.createComment(comment);
    if (node.parentNode) {
        node.parentNode.replaceChild(commentNode, node);
    }
    return commentNode;
}

export function replaceNode(node, newNode, parentNode?: Node) {
    if (Array.isArray(newNode)) {
        return [...newNode].map((nn) => replaceNode(node, nn, parentNode)).flat(1);
    }

    if (Array.isArray(node)) {
        const length = node.length;
        for (let i = 0; i < node.length - 1; i++) {
            unmountDom(node[i]);
        }
        return replaceNode(node[length - 1], newNode, parentNode);
    }

    if (node && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        node.append(newNode);
    }

    if (node && node.parentNode) {
        node.parentNode.replaceChild(newNode, node);
    } else if (parentNode) {
        parentNode.appendChild(newNode);
    }
}

export function removeAttribute(ele, prefix) {
    const attributes = ele.getAttributeNames();
    for (const key of attributes) {
        if (key.startsWith(prefix + ':') || key === prefix) {
            ele.removeAttribute(key);
        }
    }
}

export function unmountDom(dom) {
    if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
    }
}

export function isTemplate(node) {
    return node && node.nodeName === 'TEMPLATE';
}

export function isDocFragment(node) {
    return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}

export function genDocFragment(nodes) {
    const docFragment = document.createDocumentFragment();
}

export function replaceDom(origin, newDom) {
    if (origin.parentNode) {
        origin.parentNode.replaceChild(newDom, origin);
    }
}
