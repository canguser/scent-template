var getProperty$1 = {};

var parseKeyChain$1 = {};

var getBindingExpressions$1 = {};

var replaceAll$1 = {};

Object.defineProperty(replaceAll$1, "__esModule", { value: true });
replaceAll$1.replaceAll = void 0;
function replaceAll(str, search, replacement) {
    if (typeof replacement === 'function') {
        const indexList = [];
        // search for all indexes from str by searching words
        let lastIndex = 0;
        while (true) {
            const index = str.indexOf(search, lastIndex);
            if (index === -1) {
                break;
            }
            indexList.push(index);
            lastIndex = index + search.length;
        }
        return indexList
            .reduce(({ strList, extraSize }, strIndex) => {
            const replacementStr = replacement(search, strIndex, str);
            strList.splice(strIndex + extraSize, search.length, replacementStr);
            return { strList, extraSize: extraSize + replacementStr.length - search.length };
        }, {
            strList: [...str],
            extraSize: 0
        })
            .strList
            .join('');
    }
    return str.split(search).join(replacement);
}
replaceAll$1.replaceAll = replaceAll;

Object.defineProperty(getBindingExpressions$1, "__esModule", { value: true });
getBindingExpressions$1.getBindingExpressions = void 0;
const replaceAll_1 = replaceAll$1;
const SPECIFIED_PREFIX_CODE = '\x00';
const SPECIFIED_SUFFIX_CODE = '\x01';
function _replaceUnescapeString(source, target, to) {
    return replaceAll_1.replaceAll(source, target, (a, index, str) => {
        if (str[index - 1] !== '\\') {
            return to;
        }
        return a;
    });
}
function getBindingExpressions(_self, prefix = '{', suffix = '}') {
    _self = _replaceUnescapeString(_self, SPECIFIED_PREFIX_CODE, '');
    _self = _replaceUnescapeString(_self, SPECIFIED_SUFFIX_CODE, '');
    _self = _replaceUnescapeString(_self, prefix, SPECIFIED_PREFIX_CODE);
    _self = _replaceUnescapeString(_self, suffix, SPECIFIED_SUFFIX_CODE);
    const regex = new RegExp(`${SPECIFIED_PREFIX_CODE}[^${SPECIFIED_PREFIX_CODE}${SPECIFIED_SUFFIX_CODE}]*?${SPECIFIED_SUFFIX_CODE}`);
    const regexGlobal = new RegExp(`${SPECIFIED_PREFIX_CODE}([^${SPECIFIED_PREFIX_CODE}${SPECIFIED_SUFFIX_CODE}]*?)${SPECIFIED_SUFFIX_CODE}`, 'g');
    const matchResults = [..._self.matchAll(regexGlobal)];
    return {
        raws: _self
            .split(regex)
            .map((p) => replaceAll_1.replaceAll(replaceAll_1.replaceAll(p, SPECIFIED_PREFIX_CODE, prefix), SPECIFIED_SUFFIX_CODE, suffix)),
        expressions: matchResults.map(([, expression]) => expression)
    };
}
getBindingExpressions$1.getBindingExpressions = getBindingExpressions;

var flat$1 = {};

Object.defineProperty(flat$1, "__esModule", { value: true });
flat$1.flat = void 0;
function flat(array, deep = 1) {
    if (deep == 0) {
        return array;
    }
    return array.reduce((acc, val) => {
        if (Array.isArray(val)) {
            return acc.concat(flat(val, deep - 1));
        }
        else {
            return acc.concat(val);
        }
    }, []);
}
flat$1.flat = flat;

Object.defineProperty(parseKeyChain$1, "__esModule", { value: true });
parseKeyChain$1.parseKeyChain = void 0;
const getBindingExpressions_1$1 = getBindingExpressions$1;
const flat_1 = flat$1;
function parseBracket(str) {
    const { raws, expressions } = getBindingExpressions_1$1.getBindingExpressions(str, '[', ']');
    const result = [...raws];
    expressions.forEach((expression, index) => {
        result.splice(2 * index + 1, 0, expression || '[]');
    });
    return result.filter((r) => r);
}
/**
 * Parse the property name to name array.
 * @param keyChain
 */
function parseKeyChain(keyChain) {
    if (typeof keyChain === 'string') {
        keyChain = flat_1.flat(keyChain.split('.').map((key) => parseBracket(key.trim())), 2);
    }
    if (!Array.isArray(keyChain)) {
        return [keyChain];
    }
    return keyChain.map((k) => {
        if (typeof k === 'string') {
            return k.replace(/ /g, '');
        }
        return k;
    });
}
parseKeyChain$1.parseKeyChain = parseKeyChain;

Object.defineProperty(getProperty$1, "__esModule", { value: true });
var getProperty_2 = getProperty$1.getProperty = void 0;
const parseKeyChain_1 = parseKeyChain$1;
/**
 * Get the object property, it's support to using link property name like: a.b.c.d.e.f
 * @param _self
 * @param propertyName
 * @param defaultValue
 * @returns {*}
 */
function getProperty(_self, propertyName, defaultValue) {
    if (_self == null) {
        return defaultValue;
    }
    propertyName = parseKeyChain_1.parseKeyChain(propertyName);
    if (propertyName.length === 1) {
        return _self[propertyName[0]] ?? defaultValue;
    }
    else if (propertyName.length > 1) {
        return getProperty(_self[propertyName[0]], propertyName.splice(1));
    }
    return defaultValue;
}
getProperty_2 = getProperty$1.getProperty = getProperty;

var merge$1 = {};

var deepAssign$1 = {};

var isBasicData$1 = {};

Object.defineProperty(isBasicData$1, "__esModule", { value: true });
isBasicData$1.isBasicData = void 0;
function isBasicData(data) {
    return ['string', 'number', 'boolean', 'function'].includes(typeof data) || data instanceof Date || data == null;
}
isBasicData$1.isBasicData = isBasicData;

var getKeys$1 = {};

Object.defineProperty(getKeys$1, "__esModule", { value: true });
getKeys$1.getKeys = void 0;
function getKeys(obj, useSymbol, useNonenumerable) {
    const keys = [];
    if (useSymbol) {
        Object.getOwnPropertySymbols(obj).forEach((key) => {
            keys.push(key);
        });
    }
    if (useNonenumerable) {
        Object.getOwnPropertyNames(obj).forEach((key) => {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        });
        return keys;
    }
    return [...keys, ...Object.keys(obj)];
}
getKeys$1.getKeys = getKeys;

Object.defineProperty(deepAssign$1, "__esModule", { value: true });
deepAssign$1.deepAssign = void 0;
const isBasicData_1 = isBasicData$1;
const getKeys_1 = getKeys$1;
function _deepAssign(target, origin, options, _parentStack = []) {
    if (origin == null) {
        return target;
    }
    let { ignoreUndefined = false, ignoreNull = false, useSymbol = false, useNonenumerable = false, integralClasses = [], integralObjects = [] } = options || {};
    if (typeof integralClasses === 'function') {
        options.integralClasses = integralClasses = integralClasses() || [];
    }
    if (typeof integralObjects === 'function') {
        options.integralObjects = integralObjects = integralObjects() || [];
    }
    loop: for (let key of getKeys_1.getKeys(origin, useSymbol, useNonenumerable)) {
        const _value = origin[key];
        if (ignoreUndefined && _value === undefined) {
            continue;
        }
        if (ignoreNull && _value === null) {
            continue;
        }
        if (isBasicData_1.isBasicData(_value)) {
            target[key] = _value;
            continue;
        }
        for (let _class of integralClasses) {
            if (_value instanceof _class) {
                target[key] = _value;
                continue loop;
            }
        }
        if (integralObjects.includes(_value)) {
            target[key] = _value;
            continue;
        }
        if (typeof _value === 'object') {
            if (!target[key]) {
                target[key] = Array.isArray(_value) ? [] : {};
            }
            const index = _parentStack.findIndex((item) => item.origin === _value);
            if (index === -1) {
                _deepAssign(target[key], _value, options, [
                    ..._parentStack,
                    {
                        target: target[key],
                        origin: _value
                    }
                ]);
            }
            else {
                target[key] = _parentStack[index].target;
            }
            continue;
        }
        target[key] = _value;
    }
    return target;
}
function deepAssign(target, origin, options) {
    return _deepAssign(target, origin, options, []);
}
deepAssign$1.deepAssign = deepAssign;

Object.defineProperty(merge$1, "__esModule", { value: true });
merge$1.merge = configureMerge_1 = merge$1.configureMerge = void 0;
const deepAssign_1 = deepAssign$1;
const defaultOptions$3 = {
    ignoreUndefined: true
};
function configureMerge(options = {}) {
    return function (target, ...origins) {
        return origins.reduce((result, origin) => deepAssign_1.deepAssign(result, origin, {
            ...defaultOptions$3,
            ...options
        }), target);
    };
}
var configureMerge_1 = merge$1.configureMerge = configureMerge;
/**
 * Merge origin objects to target object.
 * Undefined properties in origin object will be ignored.
 * **Target object will be modified**
 * **Properties in target object might be overridden.**
 * @param target
 * @param origins
 */
merge$1.merge = configureMerge();

class ScentObject {
}

function toDashName(name) {
    return name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
}
const merge = configureMerge_1({
    integralClasses: [ScentObject]
});
function diffFrom(keys, newKeys) {
    const newKeyDiffResults = [];
    const newKeysWithoutNew = [];
    for (let i = 0; i < newKeys.length; i++) {
        const newKey = newKeys[i];
        if (keys.indexOf(newKey) === -1) {
            newKeyDiffResults.push({
                add: true,
                key: newKey,
                index: i
            });
        }
        else {
            newKeysWithoutNew.push(newKey);
        }
    }
    const newKeysIndexMap = newKeysWithoutNew.reduce((map, key, index) => {
        map[key] = index;
        return map;
    }, {});
    const diffResults = [];
    const keysWithoutDelete = [];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const newIndex = newKeysIndexMap[key];
        if (newIndex == null) {
            diffResults.unshift({
                key,
                remove: true,
                index: i
            });
        }
        else {
            keysWithoutDelete.push(key);
        }
    }
    for (let i = 0; i < keysWithoutDelete.length; i++) {
        const key = keysWithoutDelete[i];
        const newIndex = newKeysIndexMap[key];
        if (newIndex === i) ;
        else if (newIndex !== i) {
            diffResults.push({
                change: true,
                key,
                oldIndex: i,
                index: newIndex
            });
        }
    }
    diffResults.push(...newKeyDiffResults);
    const realDiffResults = [];
    for (let i = 0; i < diffResults.length; i++) {
        const diff = diffResults[i];
        if (diff.change) {
            const lastDiff = realDiffResults[realDiffResults.length - 1];
            if (lastDiff && diff.index - 1 === lastDiff.offsetIndex && diff.oldIndex - 1 === lastDiff.offsetOldIndex) {
                lastDiff.keys.push(diff.key);
                lastDiff.offsetIndex = diff.index;
                lastDiff.offsetOldIndex = diff.oldIndex;
                continue;
            }
            diff.keys = [diff.key];
            diff.offsetIndex = diff.index;
            diff.offsetOldIndex = diff.oldIndex;
            delete diff.key;
        }
        else if (diff.add) {
            const lastDiff = realDiffResults[realDiffResults.length - 1];
            if (lastDiff && diff.index - 1 === lastDiff.offsetIndex) {
                lastDiff.keys.push(diff.key);
                lastDiff.offsetIndex = diff.index;
                continue;
            }
            diff.keys = [diff.key];
            diff.offsetIndex = diff.index;
            delete diff.key;
        }
        realDiffResults.push(diff);
    }
    return realDiffResults;
}
function wrapPrototype(obj, type) {
    const proto = Object.getPrototypeOf(obj);
    const wrappedProto = type.prototype;
    Object.setPrototypeOf(obj, new Proxy({
        get origin() {
            return proto;
        },
        get wrapped() {
            return wrappedProto;
        }
    }, {
        get(target, prop, receiver) {
            const originValue = Reflect.get(target.origin || {}, prop);
            if (originValue !== undefined) {
                return originValue;
            }
            return Reflect.get(target.wrapped || {}, prop);
        },
        set() {
            return false;
        },
        has(target, prop) {
            return Reflect.has(target.origin, prop) || Reflect.has(target.wrapped, prop);
        }
    }));
    return obj;
}

class Configuration extends ScentObject {
    constructor() {
        super(...arguments);
        this.configs = {};
    }
    merge(configs, options) {
        const mergeFn = options ? configureMerge_1(options) : merge;
        mergeFn(this.configs, configs);
        return this;
    }
    getConfigurationOf(key) {
        const result = new Configuration();
        result.configs = getProperty_2(this.configs, key, {});
        return result;
    }
    get(key, defaultValue) {
        let value;
        if (key == null) {
            value = this.configs;
        }
        else {
            value = getProperty_2(this.configs, key);
        }
        if (value == null) {
            value = defaultValue;
        }
        return value;
    }
}

const configuration = new Configuration();

var genOrderedId$1 = {};

Object.defineProperty(genOrderedId$1, "__esModule", { value: true });
var genOrderedId_2 = genOrderedId$1.genOrderedId = void 0;
let initialId = 1;
function genOrderedId() {
    return '' + initialId++;
}
genOrderedId_2 = genOrderedId$1.genOrderedId = genOrderedId;

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

class ProxyAdaptor {
    constructor() {
        this.renderIdList = [];
        this.doingsInTick = [];
    }
    initialize() { }
    create(context, readonly) {
        return Object.assign({}, context);
    }
    renderIds(...ids) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let id of ids) {
                if (this.renderIdList.indexOf(id) === -1) {
                    this.renderIdList.push(id);
                }
            }
            if (this.scopeManager) {
                yield this.waitNextFrame();
                if (this.renderIdList.length > 0) {
                    console.time('rendered');
                    while (this.renderIdList.length > 0) {
                        const renderIds = this.renderIdList.splice(0);
                        // console.log('render ids', renderIds);
                        renderIds.forEach((id) => {
                            this.scopeManager.renderById(id);
                        });
                    }
                    console.timeEnd('rendered');
                    this.execTickDoings();
                }
            }
        });
    }
    waitNextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                resolve(undefined);
            });
        });
    }
    execTickDoings() {
        this.doingsInTick.forEach((doing) => {
            doing();
        });
        this.doingsInTick = [];
    }
    nextTick(doing) {
        if (doing && typeof doing === 'function') {
            this.doingsInTick.push(doing);
        }
        return new Promise((resolve) => {
            this.doingsInTick.push(resolve);
        });
    }
}

class ScopeManager extends ScentObject {
    constructor() {
        super(...arguments);
        this.scopesMapper = {};
        this.singleRenderSurroundMapping = {};
        this.proxyAdaptor = new ProxyAdaptor();
    }
    registerRenderHooks(hook) {
        const id = genOrderedId_2();
        this.singleRenderSurroundMapping[id] = {
            hook
        };
    }
    removeRenderHooks(id) {
        delete this.singleRenderSurroundMapping[id];
    }
    getSurroundHook() {
        const surroundHooks = Object.values(this.singleRenderSurroundMapping) || [];
        const realSurround = surroundHooks.reduce((prev, curr) => {
            return {
                hook: (render, id) => {
                    curr.hook(() => {
                        prev.hook(render, id);
                    }, id);
                }
            };
        }, {
            hook: (render) => {
                render();
            }
        });
        return realSurround.hook;
    }
    registerScope(scope) {
        this.scopesMapper[scope.id] = scope;
    }
    unregisterScope(scopeId) {
        const scope = this.scopesMapper[scopeId];
        if (scope) {
            const allSubIds = scope.getAllSubScopeIds();
            allSubIds.forEach((subId) => {
                this.unregisterScope(subId);
            });
            delete this.scopesMapper[scopeId];
        }
    }
    renderById(id) {
        return this.renderScope(Array.isArray(id) ? id.map((i) => this.scopesMapper[i]) : this.scopesMapper[id]);
    }
    renderScope(scope) {
        if (Array.isArray(scope)) {
            scope.forEach((scope) => this.renderScope(scope));
            return;
        }
        if (!scope) {
            return;
        }
        const surroundHook = this.getSurroundHook();
        surroundHook(() => {
            scope.render();
        }, scope.id);
        scope.renderSubScopes();
        return;
    }
    adaptProxy(adaptor) {
        adaptor.scopeManager = this;
        this.proxyAdaptor = adaptor;
        adaptor.initialize();
    }
}

class GlobalContext extends ScentObject {
    constructor(context = {}) {
        super();
        Object.assign(this, context);
    }
}

var groupBy$1 = {};

var unique$1 = {};

Object.defineProperty(unique$1, "__esModule", { value: true });
unique$1.unique = void 0;
const _uniqueArrayStore = [];
function _getUniqueArray(...args) {
    let [arr] = args;
    if (!Array.isArray(arr) || args.length > 1) {
        arr = args;
    }
    const limit = 256;
    if (_uniqueArrayStore.length > limit) {
        _uniqueArrayStore.splice(0, _uniqueArrayStore.length - limit);
    }
    for (const items of _uniqueArrayStore) {
        if (items.length !== arr.length) {
            continue;
        }
        if (items.reduce((is, item, i) => is && item === arr[i], true)) {
            return items;
        }
    }
    const result = [...arr];
    _uniqueArrayStore.push(result);
    return result;
}
function unique(...args) {
    return _getUniqueArray(...args);
}
unique$1.unique = unique;

Object.defineProperty(groupBy$1, "__esModule", { value: true });
var groupBy_2 = groupBy$1.groupBy = void 0;
const unique_1 = unique$1;
function groupBy(items, ...fields) {
    const result = new Map();
    const isMultiField = fields.length > 1;
    for (const item of items) {
        const key = isMultiField ? unique_1.unique(fields.map(field => item[field])) : item[fields[0]];
        const values = result.get(key) || new Set();
        values.add(item);
        result.set(key, values);
    }
    return result;
}
groupBy_2 = groupBy$1.groupBy = groupBy;

const defaultOptions$2 = {
    configuration
};
class BasicScope extends ScentObject {
    constructor(target, context, options) {
        super();
        this.aggregated = false;
        this.subScopes = {};
        this.existedSubScopeInfos = [];
        this.subScopeInfos = [];
        this.target = target;
        this.context = context;
        this.options = merge({}, defaultOptions$2, {
            configuration: this.context.configuration
        }, options);
        const { configuration } = this.options;
        // gen self id
        const idGenerator = configuration.get('idGenerator');
        this.id = idGenerator();
        this.scopeManager.registerScope(this);
        this.init();
    }
    init() { }
    get configuration() {
        return this.options.configuration;
    }
    get scopeManager() {
        return this.configuration.get('instances.scopeManager');
    }
    putScopeInfo(key, target, extra) {
        this.subScopeInfos.push({ key, target, extra });
    }
    putScopeInfos(infos) {
        this.subScopeInfos.push(...infos);
    }
    buildToRenderScopeInfos() {
        let subScopeInfos = this.subScopeInfos || [];
        // check if key is duplicated
        const hasDuplicated = subScopeInfos.some((info, index) => subScopeInfos.some((info2, index2) => index !== index2 && info.key === info2.key));
        if (hasDuplicated) {
            subScopeInfos = subScopeInfos.map((info, i) => {
                info.key = i + '';
                return info;
            });
            console.warn(`[${this.constructor.name}] has duplicated subScope key, so we use index as key, please check your code.`);
        }
        // build new scope infos
        const newScopeInfos = [];
        const toRenderSubScopeInfos = [];
        const allNewKeys = [];
        const existedScopeInfosGroupedByKey = groupBy_2(this.existedSubScopeInfos, 'key');
        for (const info of subScopeInfos) {
            allNewKeys.push(info.key);
            if (existedScopeInfosGroupedByKey.has(info.key)) {
                const existedScopeInfo = [...existedScopeInfosGroupedByKey.get(info.key)][0];
                if (existedScopeInfo) {
                    newScopeInfos.push(existedScopeInfo);
                    continue;
                }
            }
            toRenderSubScopeInfos.push(info);
            newScopeInfos.push(info);
        }
        // get all keys not existed in new scope infos
        const toRemoveKeys = this.existedSubScopeInfos.map((i) => i.key).filter((key) => !allNewKeys.includes(key));
        toRemoveKeys.forEach((key) => {
            delete this.existedSubScopeInfos[key];
            const existedScopes = this.subScopes[key] || [];
            existedScopes.forEach((scope) => {
                this.scopeManager.unregisterScope(scope);
            });
        });
        this.existedSubScopeInfos = newScopeInfos;
        this.subScopeInfos = [];
        // console.log(toRenderSubScopeInfos);
        return toRenderSubScopeInfos;
    }
    getContextObject() {
        return this.context.contextGetter();
    }
    renderAll() {
        this.render();
        this.renderSubScopes();
    }
    getSubContext(key, extra) {
        return this.context;
    }
    get canRenderSubScopes() {
        const subScopes = this.options.subScopes;
        return typeof subScopes === 'function' || (Array.isArray(subScopes) && subScopes.length > 0);
    }
    buildSubToRenderScopes() {
        const subScopes = this.options.subScopes;
        if (typeof subScopes === 'function') {
            const scopes = [];
            const newScopeInfos = this.buildToRenderScopeInfos();
            newScopeInfos.forEach((scopeInfo) => {
                const { target, extra, key } = scopeInfo;
                const newSubScopes = subScopes(target, this.getSubContext(key, extra));
                if (newSubScopes) {
                    scopes.push(...newSubScopes);
                    this.subScopes[key] = newSubScopes;
                }
            });
            return scopes;
        }
        return subScopes || [];
    }
    renderSubScopes() {
        if (this.aggregated && this.canRenderSubScopes) {
            const subScopes = this.options.subScopes;
            if (subScopes) {
                this.buildSubToRenderScopes();
            }
        }
    }
    getAllSubScopeIds() {
        const ids = [];
        for (const key in this.subScopes) {
            ids.push(...this.subScopes[key]);
        }
        return ids;
    }
}

var execExpression$1 = {};

Object.defineProperty(execExpression$1, "__esModule", { value: true });
var execExpression_2 = execExpression$1.execExpression = void 0;
function execExpression(expression, context) {
    if (!expression || !expression.trim()) {
        return undefined;
    }
    try {
        return new Function('context', `with(context){return (${expression})}`)(new Proxy(context || {}, {
            has() {
                return true;
            },
            get(target, p) {
                return Reflect.get(target, p, target);
            },
            set(target, p, value) {
                return Reflect.set(target, p, value, target);
            },
        }));
    }
    catch (e) {
        console.warn("there's some un-except expression: " + expression, e);
        return undefined;
    }
}
execExpression_2 = execExpression$1.execExpression = execExpression;

class IfScope extends BasicScope {
    constructor() {
        super(...arguments);
        this.aggregated = true;
    }
    render() {
        const condition = !!execExpression_2(this.options.expression, this.getContextObject());
        if (this.lastResult === condition) {
            if (condition) {
                this.putScopeInfo(this.lastOrderId, this.target);
            }
            return;
        }
        if (!condition && this.target.parentNode) {
            this.parentNode = this.target.parentElement;
            this.placeholder = document.createComment('if:' + this.id);
            this.parentNode.replaceChild(this.placeholder, this.target);
        }
        else if (condition && this.placeholder && this.parentNode) {
            this.parentNode.replaceChild(this.target, this.placeholder);
            this.putScopeInfo((this.lastOrderId = genOrderedId_2()), this.target);
        }
        else if (condition) {
            this.putScopeInfo((this.lastOrderId = genOrderedId_2()), this.target);
        }
        this.lastResult = condition;
    }
}

var template$1 = {};

var joinWith$1 = {};

Object.defineProperty(joinWith$1, "__esModule", { value: true });
joinWith$1.joinWith = void 0;
const _join = Array.prototype.join;
function joinWith(_self, separator) {
    if (typeof separator === 'function') {
        let resultStr = '';
        _self.forEach((item, index) => {
            if (index < _self.length - 1) {
                const part = item + '';
                resultStr += part;
                resultStr += separator(index, _self);
            }
            else {
                resultStr += item;
            }
        });
        return resultStr;
    }
    return _join.call(_self, separator);
}
joinWith$1.joinWith = joinWith;

Object.defineProperty(template$1, "__esModule", { value: true });
template$1.templateByLoop = template_2 = template$1.template = void 0;
const getProperty_1 = getProperty$1;
const execExpression_1 = execExpression$1;
const getBindingExpressions_1 = getBindingExpressions$1;
const joinWith_1 = joinWith$1;
const defaultOptions$1 = {
    prefix: '{',
    suffix: '}',
    withFunction: false,
    escapeChar: '\\',
    ignoreUndefined: true,
    ignoreNull: true,
    stringifyObject: false
};
function template(_self, context, options) {
    const opts = Object.assign({}, defaultOptions$1, options);
    const { prefix, suffix, withFunction } = opts;
    const { raws = [], expressions = [] } = getBindingExpressions_1.getBindingExpressions(_self, prefix, suffix);
    if (expressions.length === 0) {
        return _self;
    }
    return joinWith_1.joinWith(raws, (index) => {
        const expression = expressions[index] || '';
        if (withFunction) {
            return execExpression_1.execExpression(expression, context) || '';
        }
        return getProperty_1.getProperty(context, expression) || '';
    });
}
var template_2 = template$1.template = template;
function templateByLoop(_self, context, options) {
    const opts = Object.assign({}, defaultOptions$1, options);
    const { prefix, suffix, withFunction, escapeChar } = opts;
    let resultStr = '';
    let matchPrefixIndex = 0, matchPart = '', matchPrefix = false, matchSuffix = false, tempPrefixPart = '', tempPrefixPartSec = '';
    const resetState = () => {
        matchPrefixIndex = 0;
        matchPart = '';
        matchPrefix = false;
        matchSuffix = false;
        tempPrefixPart = '';
        tempPrefixPartSec = '';
    };
    for (let mainIndex = 0; mainIndex < _self.length; mainIndex++) {
        const char = _self[mainIndex];
        if (char === escapeChar) {
            mainIndex++;
            resultStr += tempPrefixPart + tempPrefixPartSec + matchPart + char + _self[mainIndex];
            resetState();
            continue;
        }
        if (prefix[matchPrefixIndex] === char) {
            tempPrefixPartSec += char;
            if (matchPrefixIndex === prefix.length - 1) {
                if (matchPrefix) {
                    // if already match prefix, then allow to append temp prefix part in last matches
                    resultStr += tempPrefixPart + matchPart;
                    matchPart = '';
                    tempPrefixPart = '';
                    tempPrefixPartSec = '';
                }
                matchPrefix = true;
                matchPrefixIndex = 0;
                // move existing matched part to temp prefix part
                tempPrefixPart += tempPrefixPartSec;
                tempPrefixPartSec = '';
                continue;
            }
            matchPrefixIndex++;
            continue;
        }
        else if (matchPrefixIndex > 0) {
            matchPrefixIndex = 0;
            // allow continue to add temp part to result string or matched part
        }
        if (matchPrefix) {
            for (let suffixIndex = 0; suffixIndex < suffix.length; suffixIndex++) {
                const suffixChar = suffix[suffixIndex];
                const compareIndex = mainIndex + suffixIndex;
                const compareChar = _self[mainIndex + suffixIndex];
                if (suffixChar === compareChar) {
                    if (suffixIndex === suffix.length - 1) {
                        matchSuffix = true;
                        mainIndex = compareIndex;
                    }
                }
                else {
                    break;
                }
            }
        }
        if (matchSuffix) {
            const value = withFunction ? execExpression_1.execExpression(matchPart, context) : getProperty_1.getProperty(context, matchPart);
            if (value === undefined && opts.ignoreUndefined) {
                resultStr += '';
            }
            else if (value === null && opts.ignoreNull) {
                resultStr += '';
            }
            else {
                resultStr += opts.stringifyObject && typeof value === 'object' ? JSON.stringify(value) : value;
            }
            resetState();
        }
        else if (matchPrefix && mainIndex < _self.length - 1) {
            matchPart += tempPrefixPartSec + char;
            tempPrefixPartSec = '';
        }
        else {
            resultStr += tempPrefixPart + tempPrefixPartSec + matchPart + char;
            tempPrefixPartSec = '';
            tempPrefixPart = '';
            matchPart = '';
        }
    }
    return resultStr;
}
template$1.templateByLoop = templateByLoop;

class TextScope extends BasicScope {
    render() {
        const oldContent = this.target.textContent;
        const newContent = template_2(this.options.expression, this.getContextObject(), { withFunction: true });
        if (oldContent !== newContent) {
            this.target.textContent = newContent;
        }
    }
}

class AttrScope extends BasicScope {
    init() {
        this.originValue = this.target.getAttribute(this.options.attr);
    }
    render() {
        const { attr, expression } = this.options;
        let value = execExpression_2('(' + expression + ')', this.getContextObject());
        const { _bindAttr } = this.target;
        if (_bindAttr) {
            _bindAttr[attr] = value;
        }
        else {
            if (attr === 'class') {
                if (Array.isArray(value)) {
                    value = value.filter((v) => v).join(' ');
                }
                else if (typeof value === 'object') {
                    value = Object.keys(value)
                        .filter((v) => value[v])
                        .join(' ');
                }
                if (this.originValue && this.originValue.trim()) {
                    value = [this.originValue, value].join(' ');
                }
            }
            if (attr === 'style') {
                if (typeof value === 'object') {
                    value = Object.keys(value)
                        .map((v) => `${toDashName(v)}: ${value[v]}`)
                        .join(';');
                }
                if (this.originValue && this.originValue.trim()) {
                    value = [this.originValue, value].join(';');
                }
            }
            this.target.setAttribute(attr, value);
        }
    }
}

var DomEvent = {};

Object.defineProperty(DomEvent, "__esModule", { value: true });
var unregister_1 = DomEvent.unregister = register_1 = DomEvent.register = void 0;
const genOrderedId_1 = genOrderedId$1;
const DOMEventMapper = {};
function register(dom, eventName, callback, options) {
    if (dom.addEventListener) {
        dom.addEventListener(eventName, callback, options);
    }
    const id = genOrderedId_1.genOrderedId();
    DOMEventMapper[id] = { dom, eventName, callback, options };
    // console.log(`Event name [${eventName}] registered [eventId: ${id}]`);
    return id;
}
var register_1 = DomEvent.register = register;
function unregister(eventId) {
    if (eventId) {
        const { dom, eventName, callback } = DOMEventMapper[eventId] || {};
        if (dom && dom.removeEventListener) {
            dom.removeEventListener(eventName, callback);
            delete DOMEventMapper[eventId];
            // console.log(`Event name [${eventName}] removed [eventId: ${eventId}]`);
        }
    }
}
unregister_1 = DomEvent.unregister = unregister;

class EventScope extends BasicScope {
    render() {
        const { eventName, expression } = this.options;
        const func = execExpression_2(`
            (function($e){
                const result = (${expression});
                if (typeof result === 'function'){
                    return result.call(this, $e)
                }
            })
        `, this.getContextObject());
        if (this.eventHandlerId) {
            unregister_1(this.eventHandlerId);
        }
        // console.log('register event', eventName, this.target);
        this.eventHandlerId = register_1(this.target, eventName, (e) => {
            func.call(this.getContextObject(), e);
        });
    }
}

class ElementSetterScope extends BasicScope {
    render() {
        this.target[this.options.property] = execExpression_2(this.options.expression, this.getContextObject());
    }
}

const defaultOptions = {
    configuration
};
class Context extends ScentObject {
    constructor(context, options) {
        super();
        this.options = merge({}, defaultOptions, options);
        const globalContext = this.configuration.get('instances.globalContext') || {};
        this.context = wrapPrototype(this.buildContext(context || {}), globalContext);
    }
    get scope() {
        return new Proxy({}, {
            get: (target, p) => {
                const scopes = this.configuration.get('scopes', {});
                if (typeof p === 'string') {
                    // get scope name by splice string after 'bind' and convert to lowercase initial
                    const parts = p.split('bind');
                    const scopeName = parts[1] ? parts[1].charAt(0).toLowerCase() + parts[1].slice(1) : '';
                    if (scopeName in scopes) {
                        return (ele, ...args) => {
                            const scope = new scopes[scopeName](ele, this, ...args);
                            this.scopeManager.renderScope(scope);
                            return scope.id;
                        };
                    }
                }
                return () => console.warn('no such scope bound:', p);
            },
            set: () => true
        });
    }
    get scopeManager() {
        return this.configuration.get('instances.scopeManager');
    }
    get configuration() {
        return this.options.configuration;
    }
    get contextGetter() {
        // const globalContext = this.configuration.get<GlobalContext>('instances.globalContext') || {};
        // const GlobalContextClass = function() {};
        // GlobalContextClass.prototype = globalContext;
        return () => this.context;
    }
}

class ProxyContext extends Context {
    get proxyHandler() {
        return this.options.proxyHandler;
    }
    buildContext(context) {
        return new Proxy(context, this.proxyHandler);
    }
}

class ForScope extends BasicScope {
    constructor() {
        super(...arguments);
        this.keyTargetsMapping = {};
        this.existedKeys = [];
        this.aggregated = true;
        this.keyIndexMap = {};
    }
    getPlaceholder() {
        return this.placeholder || (this.placeholder = document.createComment('for' + this.id));
    }
    getParentNode() {
        return this.parentNode || (this.parentNode = this.target.parentNode);
    }
    render() {
        const parentNode = this.getParentNode();
        if (this.target.parentNode) {
            const placeholder = this.getPlaceholder();
            parentNode.replaceChild(placeholder, this.target);
        }
        const items = this.items;
        const key = this.options.key;
        let keys = items.map((item, i) => { var _a; return (_a = item[key]) !== null && _a !== void 0 ? _a : i; });
        const hasDuplicateKeys = keys.some((key, index) => keys.indexOf(key) !== index);
        if (hasDuplicateKeys) {
            keys = items.map((item, i) => i + '');
            console.warn('[Rapidly] For scope has duplicate keys, use index as key instead.');
        }
        const existedKeys = this.existedKeys;
        const diffs = diffFrom(existedKeys, keys);
        for (const diff of diffs) {
            if (diff.remove) {
                this.destroyKey(diff.key);
                existedKeys.splice(diff.index, 1);
                continue;
            }
            if (diff.change) {
                const fragment = document.createDocumentFragment();
                diff.keys.forEach((key) => {
                    fragment.appendChild(this.keyTargetsMapping[key]);
                });
                const toIndex = diff.offsetIndex;
                const existedLength = existedKeys.length;
                if (toIndex === existedLength - 1) {
                    parentNode.insertBefore(fragment, this.getPlaceholder());
                }
                else {
                    parentNode.insertBefore(fragment, this.keyTargetsMapping[existedKeys[toIndex + 1]]);
                }
                continue;
            }
            if (diff.add) {
                const fragment = document.createDocumentFragment();
                diff.keys.forEach((key) => {
                    const ele = (this.keyTargetsMapping[key] = this.target.cloneNode(true));
                    fragment.appendChild(ele);
                });
                const toIndex = diff.index;
                if (toIndex === existedKeys.length) {
                    parentNode.insertBefore(fragment, this.getPlaceholder());
                }
                else {
                    parentNode.insertBefore(fragment, this.keyTargetsMapping[existedKeys[toIndex]]);
                }
            }
        }
        this.existedKeys = keys;
        this.keyIndexMap = {};
        this.putScopeInfos(this.existedKeys.map((key, i) => {
            this.keyIndexMap[key] = i;
            return {
                key,
                target: this.keyTargetsMapping[key]
            };
        }));
    }
    destroyKey(key) {
        const target = this.keyTargetsMapping[key];
        if (target && target.parentNode) {
            target.parentNode.removeChild(target);
        }
        delete this.keyTargetsMapping[key];
    }
    get items() {
        return execExpression_2(this.options.of, this.getContextObject()) || [];
    }
    getItemIndex(key) {
        return this.keyIndexMap[key];
    }
    getSubContext(key) {
        return new ProxyContext({}, {
            proxyHandler: {
                get: (target, p) => {
                    if (p === (this.options.index || '$index')) {
                        return this.getItemIndex(key);
                    }
                    if (p === (this.options.item || '$item')) {
                        const index = this.getItemIndex(key);
                        return this.items[index];
                    }
                    return this.getContextObject()[p];
                },
                set: (target, p, value) => {
                    if (p === (this.options.item || '$item')) {
                        const index = this.getItemIndex(key);
                        const items = this.items || [];
                        items[index] = value;
                        return true;
                    }
                    this.getContextObject()[p] = value;
                    return true;
                }
            },
            configuration: this.configuration
        });
    }
}

class AdaptedContext extends Context {
    buildContext(context) {
        return this.adaptor.create(context);
    }
    get adaptor() {
        return this.configuration.get('instances.scopeManager').proxyAdaptor;
    }
}

class HtmlScope extends BasicScope {
    constructor() {
        super(...arguments);
        this.aggregated = true;
    }
    render() {
        if (!this.options.expression)
            return;
        const oldContent = this.target.innerHTML;
        const newContent = execExpression_2(this.options.expression, this.getContextObject());
        if (oldContent !== newContent) {
            this.target.innerHTML = newContent;
        }
    }
}

class Scent extends ScentObject {
    constructor() {
        super();
        this.configuration = new Configuration();
        this.globalContext = new GlobalContext();
        this.configuration.merge({
            idGenerator: () => '_' + genOrderedId_2(),
            instances: {
                scopeManager: new ScopeManager(),
                globalContext: this.globalContext,
                scent: this,
            },
            scopes: {
                if: IfScope,
                text: TextScope,
                for: ForScope,
                attr: AttrScope,
                event: EventScope,
                setter: ElementSetterScope,
                html: HtmlScope
            }
        });
    }
    createContext(context = {}) {
        return new AdaptedContext(context, {
            configuration: this.configuration
        });
    }
    use(plugin) {
        if (typeof plugin === 'function') {
            plugin(this);
        }
        return this;
    }
}

configuration.merge({
    idGenerator: () => '_' + genOrderedId_2(),
    instances: {
        scopeManager: new ScopeManager(),
        globalContext: new GlobalContext(),
        scent: new Scent()
    },
    scopes: {
        if: IfScope,
        text: TextScope,
        for: ForScope,
        attr: AttrScope,
        event: EventScope,
        setter: ElementSetterScope,
        html: HtmlScope
    }
});
function getDefaultInstance() {
    let scent = configuration.get('instances.scent');
    if (!scent) {
        scent = new Scent();
        configuration.merge({ instances: { scent } });
    }
    return scent;
}
function createContext(context) {
    const scent = getDefaultInstance();
    return scent.createContext(context);
}
function use(plugin) {
    const scent = getDefaultInstance();
    scent.use(plugin);
    return scent;
}

export { AdaptedContext, IfScope, ProxyAdaptor, Scent, ScopeManager, TextScope, configuration, createContext, getDefaultInstance, use };
