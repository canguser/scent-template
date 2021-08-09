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