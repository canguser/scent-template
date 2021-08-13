export * from './classes/HtmlRenderer';
export * from './utils/NormalUtils';

export function reactContext(component, context) {

    component.afterContextUsed(renderId => {
        // console.log('on single item rendered');
        for (const p of identityList) {
            let renderIdList = [];
            if (p in identityRenderIdMapping) {
                renderIdList = identityRenderIdMapping[p] || [];
            }
            if (!renderIdList.includes(renderId)) {
                renderIdList.push(renderId);
            }
            identityRenderIdMapping[p] = renderIdList;
        }
        identityList = [];
    });

    var identityList = [];
    var identityRenderIdMapping = Object.create(null);

    function react(obj) {
        return new Proxy(obj, {
            get(target, p, receiver) {
                identityList.push(p);
                return Reflect.get(target, p, receiver);
            },
            set(target, p: string, value, receiver) {
                const result = Reflect.set(target, p, value, receiver);
                const renderIdList = identityRenderIdMapping[p] || [];
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
        });
    }

    const rc = react(context);

    component.context = rc;
    return rc;
}