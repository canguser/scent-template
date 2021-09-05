import { getOrigin, getReact, isReactive, react, subscribe } from '@scent/proxies';
import { _getMaps } from '@scent/proxies/main';

export function reactContext(component, context) {

    let effectList = [];
    let subscriber;
    const renderIdMap = {};

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

        let subscriberItems = renderIdMap[renderId] || [];
        for (const subscriberItem of subscriberItems) {
            if (subscriberItem) {
                subscriberItem.stop();
            }
        }

        subscriberItems = effectList.map((({ target, propertyChain: pc }) => subscribe(target, pc, {
            set(target, propertyChain, value, old) {
                if (value !== old) {
                    console.time('render: '+renderId);
                    component.renderSingleItemDelay(renderId);
                    component.nextTick(() => {
                        console.timeEnd('render: '+renderId);
                    });
                }
            }
        })));

        renderIdMap[renderId] = subscriberItems;

    });

    const ctx = react(context);

    component.context = ctx;

    return ctx;
}

export function unProxy(obj) {
    return getOrigin(obj);
}