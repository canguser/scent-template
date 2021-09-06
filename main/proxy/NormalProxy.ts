import { get, getOrigin, parseChain, react, subscribe } from '@scent/proxies';

export function reactContext(component, context) {

    let effectList = [];
    let subscriber;
    const renderIdEffectsMap = {};
    const workedSubscribes = [];

    function addSubscribe(target, property, renderIdList = []) {
        let info = workedSubscribes.find(sb => sb.target === target && sb.property === property);
        if (!info) {
            info = {
                target,
                property,
                renderIdList,
                subscriber: subscribe(target, property, {
                    set(target, propertyChain, value, old) {
                        const properties = parseChain(propertyChain);
                        const lastProperty = properties.splice(properties.length - 1, 1)[0];
                        const lastParent = get(target, properties);
                        if (value !== old || (Array.isArray(lastParent) && lastProperty === 'length')) {
                            info.renderIdList.forEach((renderId) => {
                                component.renderSingleItemDelay(renderId);
                            });
                        }
                    }
                })
            };
            workedSubscribes.push(info);
        } else {
            for (const renderId of renderIdList || []) {
                if (!info.renderIdList.includes(renderId)) {
                    info.renderIdList.push(renderId);
                }
            }
        }
    }

    function removeRenderIdFromAll(renderIdList = []) {
        for (const info of workedSubscribes) {
            removeRenderIdFromSubscribeInfo(info, renderIdList);
        }
    }

    function removeRenderIdFromSubscribeInfo(info, renderIdList = []) {
        for (const renderId of renderIdList || []) {
            if (info.renderIdList.includes(renderId)) {
                info.renderIdList.splice(info.renderIdList.indexOf(renderId), 1);
            }
        }
        if (info.renderIdList.length === 0) {
            info.subscriber.stop();
            const index = workedSubscribes.indexOf(info);
            workedSubscribes.splice(index, 1);
        }
    }

    function removeSubscribe(target, property, renderIdList = []) {
        let info = workedSubscribes.find(sb => sb.target === target && sb.property === property);
        if (info) {
            removeRenderIdFromSubscribeInfo(info, renderIdList);
        }
    }

    component.beforeItemRendered(id => {
        renderIdEffectsMap[id] = [];
    });

    component.afterItemRendered(renderId => {
        removeRenderIdFromAll([renderId]);
        const effects = renderIdEffectsMap[renderId] || [];
        for (const { target, propertyChain } of effects) {
            addSubscribe(target, propertyChain, [renderId]);
        }
    });

    component.beforeContextUsed(() => {
        effectList = [];
        subscriber = subscribe('all', {
            get(target, propertyChain) {
                if (!effectList.some(({ target: t, propertyChain: pc }) => t === target && pc === propertyChain)) {
                    effectList.push({
                        target,
                        propertyChain
                    });
                }
            }
        });
    });

    component.afterContextUsed(renderId => {
        subscriber.stop();

        let effects = renderIdEffectsMap[renderId] || [];
        effects.push(...effectList);
        renderIdEffectsMap[renderId] = effects;

        effectList = [];
    });

    const ctx = react(context);

    component.context = ctx;

    return ctx;
}

export function unProxy(obj) {
    return getOrigin(obj);
}