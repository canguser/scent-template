export function getAllElements(ele: Element): Element[] {
    return [ele].concat([...(ele.children || [])].map(e => getAllElements(e)).flat());
}

export function getAllNodes(ele: Element): Node[] {
    return ([ele] as Node[]).concat([...(ele.childNodes || [])].map(e => getAllNodes(e as Element)).flat());
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
    if (node.parentElement) {
        node.parentElement.replaceChild(commentNode, node);
    }
    return commentNode;
}

export function removeAttribute(ele, prefix) {
    const attributes = ele.getAttributeNames();
    for (const key of attributes) {
        if (key.startsWith(prefix + ':') || key === prefix) {
            ele.removeAttribute(key);
        }
    }
}