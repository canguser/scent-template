import { isBlank } from '@rapidly/utils/lib/commom/string/isBlank';
import { isNotBlank } from '@rapidly/utils/lib/commom/string/isNotBlank';

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

export function replaceNodes_v2(nodes, newNodes, parentNode?: Node) {
    nodes = [...Array.isArray(nodes) ? nodes : [nodes]];
    parentNode = parentNode || nodes[0].parentNode;
    newNodes = [...Array.isArray(newNodes) ? newNodes : [newNodes]];
    if (parentNode) {
        const fragment = document.createDocumentFragment();
        const placedNode = nodes.splice(nodes.length - 1, 1)[0];
        // remove all nodes
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (parentNode === node.parentNode) {
                parentNode.removeChild(node);
            }
        }
        const allNodes = [...parentNode.childNodes];
        let hasAppend = false;
        for (let i = 0; i < allNodes.length; i++) {
            const node = allNodes[i];
            if (node === placedNode) {
                fragment.append(...newNodes);
                hasAppend = true;
                unmountDom(node);
                continue;
            }
            fragment.appendChild(node);
        }
        if (!hasAppend) {
            fragment.append(...newNodes);
        }
        parentNode.appendChild(fragment);
    }
}

export function replaceNodes(nodes, newNodes, parentNode?: Node): void {
    return replaceNodes_v2(nodes, newNodes, parentNode);
    let node = nodes;
    if (Array.isArray(nodes)) {
        const length = nodes.length;
        for (let i = 0; i < nodes.length - 1; i++) {
            unmountDom(nodes[i]);
        }
        node = nodes[length - 1];
    }
    if (!node) {
        if (!parentNode) {
            return;
        }
        const newNodeList = Array.isArray(newNodes) ? newNodes : [newNodes];
        newNodeList.forEach((newNode) => {
            parentNode.appendChild(newNode);
        });
        return;
    }
    parentNode = node.parentNode || parentNode;
    if (!parentNode) {
        return;
    }
    if (Array.isArray(newNodes)) {
        const tempNode = document.createComment('temp');
        parentNode.replaceChild(tempNode, node);
        newNodes.forEach((newNode) => {
            parentNode.insertBefore(newNode, tempNode);
        });
        unmountDom(tempNode);
    } else {
        parentNode.replaceChild(newNodes, node);
    }
}

export function removeAllChildren(node: Node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
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

export function getAttributeNodes(ele: Element, prefixList) {
    const attributes = ele.attributes || [];
    // get all attributes nodes match prefix
    return Array.from(attributes).filter((attr) => prefixList.some((prefix) => attr.name.startsWith(prefix)));
}

export function getAttributeInfoMapping(ele: Element, prefixList = [], aliasMapping = {}) {
    const attributes = [...(ele.attributes || [])].map((attr) => {
        let parts = attr.name.split(':');
        if (parts.length === 2 && parts[0] === '') {
            parts[1] = ':' + parts[1];
        }
        if (parts.length === 1) {
            parts = ['', parts[0]];
        }
        const [prefix, name] = parts;
        return {
            fullName: attr.name,
            prefix: prefix,
            name,
            value: attr.value
        };
    });
    const result = {};
    prefixList.forEach((prefix) => {
        prefix = prefix.trim().replace(/:$/, '');
        const aliasPrefix = aliasMapping[prefix] || prefix;
        result[prefix] = attributes.filter((attr) => {
            if (isNotBlank(attr.prefix)) {
                return attr.prefix === prefix || attr.prefix === aliasPrefix;
            }
            if (attr.name.startsWith(aliasPrefix)) {
                attr.name = attr.name.replace(aliasPrefix, '');
                return true;
            }
            return false;
        });
    });
    return result;
}
