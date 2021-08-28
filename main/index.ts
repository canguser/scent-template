export * from './classes/HtmlRenderer';
export * from './utils/NormalUtils';

declare const window: { [key: string]: any };

export function reactContext(component, context) {

    component.beforeContextUsed(() => {
        window.identityList = [];
    });

    component.afterContextUsed(renderId => {
        // console.log('on single item rendered', component.getRenderItem(renderId));
        for (const p of window.identityList) {
            addRenderIdList(p, renderId);
        }
        window.identityList = [];
    });

    window.identityList = [];
    window.identityRenderIdMapping = Object.create(null);

    function getRenderIdList(properties = []) {
        let targetMapping = {
            renderIdList: [],
            properties: window.identityRenderIdMapping
        };
        for (const p of properties) {
            if (!targetMapping) {
                return [];
            }
            targetMapping = (targetMapping.properties || {})[p] || {};
        }
        return targetMapping.renderIdList || [];
    }

    function addRenderIdList(properties, renderId) {
        let targetMapping = {
            renderIdList: [],
            properties: window.identityRenderIdMapping
        };
        for (const p of properties) {
            if (!targetMapping.properties) {
                targetMapping.properties = {};
            }
            if (!targetMapping.properties[p]) {
                targetMapping.properties[p] = { renderIdList: [] };
            }
            const existList = targetMapping.properties[p].renderIdList || [];
            if (!existList.includes(renderId)) {
                existList.push(renderId);
            }
            targetMapping.properties[p].renderIdList = existList;
            targetMapping = targetMapping.properties[p];
        }
    }

    function getReactTarget(target, properties = [], autoFill = false) {
        return properties.reduce((t, p) => {
            if (!t) {
                return undefined;
            }
            if (autoFill && t[p] == null) {
                t[p] = {};
            }
            t = t[p];
            return t;
        }, target);
    }

    function react(obj, parentNodes = []) {
        return new Proxy({
            snapValue: getReactTarget(obj, parentNodes),
            context: obj
        }, {
            get(target, p, receiver) {
                window.identityList.push([...parentNodes, p]);
                const propertiesChain = [...parentNodes, p];
                const reactTarget = getReactTarget(obj, parentNodes);
                const value = Reflect.get(reactTarget, p);
                if (typeof value !== 'object') {
                    return value;
                }
                return react(obj, propertiesChain);
            },
            set(target, p: string, value, receiver) {

                const propertiesChain = [...parentNodes, p];
                const reactTarget = window.r = getReactTarget(obj, parentNodes, true);
                const originValue = Reflect.get(reactTarget, p);
                // console.log('origin', originValue);
                // console.log('to', value);

                let alwaysTrigger = (
                    reactTarget instanceof Array && p === 'length'
                );

                if (originValue !== value || alwaysTrigger) {
                    const result = Reflect.set(reactTarget, p, value);

                    const renderIdList = getRenderIdList(propertiesChain);
                    console.time('setter:' + p);
                    for (const renderId of renderIdList) {
                        component.renderSingleItemDelay(renderId);
                    }
                    component.nextTick()
                        .then(() => {
                            console.timeEnd('setter:' + p);
                        });
                    return result;
                }
                return true;
            },
            has(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.has(reactTarget, ...args);
            },
            ownKeys(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.ownKeys(reactTarget, ...args);
            },
            getOwnPropertyDescriptor(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.getOwnPropertyDescriptor(reactTarget, ...args);
            },
            setPrototypeOf(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.setPrototypeOf(reactTarget, ...args);
            },
            defineProperty(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.defineProperty(reactTarget, ...args);
            },
            deleteProperty(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.deleteProperty(reactTarget, ...args);
            },
            apply(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.apply(reactTarget, ...args);
            },
            construct(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.construct(reactTarget, ...args);
            },
            getPrototypeOf(target: any, ...args) {
                const reactTarget = getReactTarget(obj, parentNodes);
                return Reflect.getPrototypeOf(reactTarget, ...args);
            }
        });
    }

    const rc = react(context);

    component.context = rc;
    return rc;
}