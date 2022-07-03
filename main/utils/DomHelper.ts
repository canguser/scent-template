import { isNotBlank } from '@rapidly/utils/lib/commom/string/isNotBlank';
import { toCamelName } from './NormalUtils';

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

export function getNodeAttribute(node: Node, name: string) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as Element).getAttribute(name);
    }
    return null;
}

export function clearNodeAttribute(node: Node, name: string) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        (node as Element).removeAttribute(name);
    }
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
        const [prefix, nameSuffix] = parts;
        const [name, more] = nameSuffix.split('.');
        return {
            fullName: attr.name,
            prefix: prefix,
            name,
            more,
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

export function getAttrObject(target: Node) {
    if (target.nodeType === Node.ELEMENT_NODE) {
        const ele = target as Element;
        const attrNames = ele.getAttributeNames();
        return attrNames.reduce((result, name) => {
            const value = ele.getAttribute(name);
            if (value) {
                result[toCamelName(name)] = value;
            }
            return result;
        }, {});
    }
    return {};
}