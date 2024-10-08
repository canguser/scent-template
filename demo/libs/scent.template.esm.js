var StrategyType;
(function (StrategyType) {
    StrategyType[StrategyType["Inherited"] = 0] = "Inherited";
    StrategyType[StrategyType["Alienated"] = 1] = "Alienated";
    StrategyType[StrategyType["Alienated_UNIQUE"] = 2] = "Alienated_UNIQUE";
})(StrategyType || (StrategyType = {}));

class BasicStrategy {
    constructor() {
        this.type = StrategyType.Inherited;
    }
}

var isNotBlank$1 = {};

var isBlank$1 = {};

Object.defineProperty(isBlank$1, "__esModule", { value: true });
isBlank$1.isBlank = void 0;
function isBlank(str) {
    return str == null || str.trim() === '';
}
isBlank$1.isBlank = isBlank;

Object.defineProperty(isNotBlank$1, "__esModule", { value: true });
var isNotBlank_2 = isNotBlank$1.isNotBlank = void 0;
const isBlank_1 = isBlank$1;
function isNotBlank(str) {
    return !isBlank_1.isBlank(str);
}
isNotBlank_2 = isNotBlank$1.isNotBlank = isNotBlank;

function traversingTreeNode(treeNode, childProperty, callback, { parentNode, avoidModify = true } = {}) {
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
function toDashName(name) {
    return name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
}
function toCamelName(name) {
    return name.replace(/-([a-z])/g, (m, w) => w.toUpperCase());
}

function removeAllChildren(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}
function getAttributeNodes(ele, prefixList) {
    const attributes = ele.attributes || [];
    // get all attributes nodes match prefix
    return Array.from(attributes).filter((attr) => prefixList.some((prefix) => attr.name.startsWith(prefix)));
}
function getNodeAttribute(node, name) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        return node.getAttribute(name);
    }
    return null;
}
function clearNodeAttribute(node, name) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        node.removeAttribute(name);
    }
}
function getAttributeInfoMapping(ele, prefixList = [], aliasMapping = {}) {
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
            if (isNotBlank_2(attr.prefix)) {
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
function getAttrObject(target) {
    if (target.nodeType === Node.ELEMENT_NODE) {
        const ele = target;
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

class ForStrategy extends BasicStrategy {
    constructor() {
        super(...arguments);
        this.type = StrategyType.Alienated_UNIQUE;
        this.prefixList = ['s-for'];
    }
    match(element, context, subScopes) {
        const attributeNode = getAttributeNodes(element, this.prefixList)[0];
        if (!attributeNode) {
            return false;
        }
        const keyAttribute = element.getAttribute('s-key');
        const [, item] = attributeNode.name.split(':');
        const targetKey = attributeNode.value;
        element.removeAttribute(attributeNode.name);
        element.removeAttribute('s-key');
        return [
            context.scope.bindFor(element, {
                of: targetKey,
                key: keyAttribute,
                item,
                subScopes: (target, context) => subScopes(target, context)
            })
        ];
    }
}

class IfStrategy extends BasicStrategy {
    constructor() {
        super(...arguments);
        this.type = StrategyType.Alienated_UNIQUE;
        this.key = 's-if';
    }
    match(element, context, subScopes) {
        var _a;
        if (!((_a = element.hasAttribute) === null || _a === void 0 ? void 0 : _a.call(element, this.key)))
            return false;
        const expression = element.getAttribute(this.key);
        element.removeAttribute(this.key);
        return [
            context.scope.bindIf(element, {
                expression,
                subScopes: (target, context) => {
                    return subScopes(target, context);
                }
            })
        ];
    }
}

class AttrStrategy extends BasicStrategy {
    constructor() {
        super(...arguments);
        this.prefixAlisa = ['s-bind', ':'];
    }
    match(element, context) {
        if (element.nodeType === Node.ELEMENT_NODE) {
            const [prefix, alias] = this.prefixAlisa;
            const attrInfos = getAttributeInfoMapping(element, [prefix], { [prefix]: alias })[prefix] || [];
            if (attrInfos.length === 0) {
                return false;
            }
            // generate render scopes from attribute nodes
            return attrInfos.map((attr) => {
                element.removeAttribute(attr.fullName);
                return [context.scope.bindAttr(element, {
                    attr: toCamelName(attr.name),
                    expression: attr.value
                }), element.tagName === 'INPUT' ? [
                    context.scope.bindSetter(element, {
                        property: toCamelName(attr.name),
                        expression: attr.value
                    })
                ] : []];
            }).flat();
        }
        return false;
    }
}

class EventStrategy extends BasicStrategy {
    constructor() {
        super(...arguments);
        this.prefixList = ['s-on', '@'];
    }
    match(element, context) {
        const [prefix, alias] = this.prefixList;
        const attrInfos = getAttributeInfoMapping(element, [prefix], { [prefix]: alias })[prefix] || [];
        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.map((attr) => {
            // remove all related attributes from target
            element.removeAttribute(attr.fullName);
            return context.scope.bindEvent(element, {
                eventName: attr.name,
                expression: attr.value
            });
        });
    }
}

class ModelStrategy extends BasicStrategy {
    constructor() {
        super(...arguments);
        this.prefixList = ['s-model'];
    }
    match(element, context) {
        const [prefix, alias] = this.prefixList;
        const attrInfos = getAttributeInfoMapping(element, [prefix], { [prefix]: alias })[prefix] || [];
        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.reduce((scopes, attr) => {
            let { value, name, more } = attr;
            name = name || 'value';
            // console.log(value, name, more);
            scopes.push(context.scope.bindSetter(element, {
                property: name,
                expression: value
            }));
            scopes.push(context.scope.bindAttr(element, {
                attr: name,
                expression: value
            }));
            scopes.push(context.scope.bindEvent(element, {
                eventName: more || 'input',
                expression: `e=>((${value})=e.detail?e.detail.${name}:(e.target?e.target.${name}:null))`
            }));
            // remove all related attributes from target
            element.removeAttribute(attr.fullName);
            return scopes;
        }, []);
    }
}

class TextStrategy extends BasicStrategy {
    match(element, context) {
        if (element.nodeType === Node.TEXT_NODE && element.parentNode.nodeType !== Node.COMMENT_NODE) {
            const text = element.textContent;
            if (text.trim()) {
                return [context.scope.bindText(element, { expression: text })];
            }
        }
        return false;
    }
}

let configuration;
function getConfiguration() {
    if (!configuration) {
        console.warn('Using method `Scent.use()` to add scentPlugin from the template first.');
    }
    return configuration;
}
function useConfiguration(config) {
    configuration = config;
}

class HtmlStrategy extends BasicStrategy {
    constructor() {
        super(...arguments);
        this.type = StrategyType.Alienated_UNIQUE;
        this.key = 's-html';
    }
    match(element, context, subScopes) {
        var _a;
        if (!((_a = element.hasAttribute) === null || _a === void 0 ? void 0 : _a.call(element, this.key)))
            return false;
        const expression = element.getAttribute(this.key);
        element.removeAttribute(this.key);
        return [
            context.scope.bindHtml(element, {
                expression
            })
        ];
    }
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class ComponentInstance {
    constructor(target) {
        this.target = target;
        this.refContextMap = new Map();
    }
    getSubContextByRef(ref) {
        return this.refContextMap.get(ref);
    }
    setSubContextByRef(ref, context) {
        this.refContextMap.set(ref, context);
    }
    nextTick(fn) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const adaptor = getConfiguration().get('instances.scopeManager').proxyAdaptor;
            return ((_a = adaptor === null || adaptor === void 0 ? void 0 : adaptor.nextTick) === null || _a === void 0 ? void 0 : _a.call(adaptor, fn)) || fn();
        });
    }
}
function renderComponent(target, components, parentComponent) {
    const dashedComponents = {};
    Object.keys(components).forEach((key) => {
        dashedComponents[toDashName(key)] = components[key];
    });
    if (target.nodeType === Node.ELEMENT_NODE) {
        const adaptor = getConfiguration().get('instances.scopeManager').proxyAdaptor;
        for (const key in dashedComponents) {
            if ((target.tagName || '').toLowerCase() === key) {
                const componentFn = dashedComponents[key];
                const props = getAttrObject(target);
                const reactProps = (target['_bindAttr'] = adaptor.create(props));
                const component = componentFn(reactProps, {
                    slotsParent: target,
                    parentInstance: parentComponent,
                    alias: key,
                    refName: target.getAttribute('ref')
                });
                component['_bindAttr'] = reactProps;
                target.parentNode.replaceChild(component, target);
                return component;
            }
        }
    }
    return false;
}
function renderSlots(target, slotsParent) {
    if (slotsParent) {
        if (target.nodeType === Node.ELEMENT_NODE && target.tagName.toLowerCase() === 'slot') {
            const slotName = target.getAttribute('name') || '';
            const fragment = document.createDocumentFragment();
            for (const node of [...slotsParent.childNodes]) {
                if (node.nodeType === Node.ELEMENT_NODE ||
                    node.nodeType === Node.TEXT_NODE ||
                    node.nodeType === Node.COMMENT_NODE) {
                    const slotNameAttr = getNodeAttribute(node, 'slot') || '';
                    if (slotNameAttr === slotName) {
                        clearNodeAttribute(node, 'slot');
                        fragment.appendChild(node);
                    }
                }
            }
            if (fragment.childNodes.length > 0) {
                target.parentNode.replaceChild(fragment, target);
                return true;
            }
        }
    }
    return false;
}
function renderByStrategy(options) {
    const { target, components, context, instance } = options;
    const _strategies = getConfiguration().get('strategies') || [];
    const results = [];
    traversingTreeNode(target, 'childNodes', (node) => {
        let canGoDeep = true;
        const component = renderComponent(node, components || {}, instance);
        if (component) {
            node = component;
        }
        if (renderSlots(node, options.slotsParent)) {
            return false;
        }
        for (let strategy of _strategies) {
            let result = strategy.match(node, context, (_target, _context) => {
                return renderByStrategy(Object.assign(Object.assign({}, options), { target: _target, context: _context || context }));
            });
            if (result) {
                results.push(...result);
                if ([StrategyType.Alienated, StrategyType.Alienated_UNIQUE].includes(strategy.type)) {
                    canGoDeep = false;
                }
                if (strategy.type === StrategyType.Alienated_UNIQUE) {
                    break;
                }
            }
        }
        return canGoDeep;
    });
    return results;
}
function defineComponent(options) {
    return (props, fnOptions) => {
        var _a, _b;
        const { slotsParent, parentInstance, refName, alias } = fnOptions || {};
        props = props || {};
        const adaptor = getConfiguration().get('instances.scopeManager').proxyAdaptor;
        const template = document.createElement('template');
        template.innerHTML = options.template;
        const readonlyProps = adaptor.create(props, true);
        const component = slotsParent ? slotsParent.cloneNode(true) : document.createElement(alias || options.name || 'App');
        removeAllChildren(component);
        const instance = new ComponentInstance(component);
        const scentInstance = getConfiguration().get('instances.scent');
        const context = scentInstance.createContext(Object.assign(Object.assign({}, (_b = (_a = options.setup) === null || _a === void 0 ? void 0 : _a.call) === null || _b === void 0 ? void 0 : _b.call(_a, instance, readonlyProps, instance)), { $props: readonlyProps }));
        const result = template.content;
        renderByStrategy({
            target: result,
            components: options.components,
            context,
            slotsParent,
            instance
        });
        if (parentInstance && refName) {
            parentInstance.setSubContextByRef(refName, adaptor.create(context.contextGetter(), true));
        }
        component.appendChild(result);
        return component;
    };
}

const scentTemplate = (scent) => {
    console.log(scent);
    scent.configuration.merge({
        strategies: [
            new ForStrategy(),
            new IfStrategy(),
            new AttrStrategy(),
            new EventStrategy(),
            new ModelStrategy(),
            new HtmlStrategy(),
            new TextStrategy()
        ]
    }, {
        integralClasses: [BasicStrategy]
    });
    useConfiguration(scent.configuration);
};

export { defineComponent, renderByStrategy, scentTemplate };
