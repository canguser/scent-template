export * from './classes/HtmlRenderer';
export * from './utils/NormalUtils';

export function reactContext(component, context) {

    component.afterItemRendered(item => {
        // console.log('on single item rendered');
        for (const p of identityList) {
            let items = [];
            if (p in identityItemMapping) {
                items = identityItemMapping[p] || [];
            }
            if (!items.includes(item)) {
                items.push(item);
            }
            identityItemMapping[p] = items;
        }
        identityList = [];
    });

    var identityList = [];
    var identityItemMapping = Object.create(null);

    function react(obj) {
        return new Proxy(obj, {
            get(target, p, receiver) {
                identityList.push(p);
                return Reflect.get(target, p, receiver);
            },
            set(target, p: string, value, receiver) {
                const result = Reflect.set(target, p, value, receiver);
                const items = identityItemMapping[p] || [];
                console.time('setter:' + p);
                for (const item of items) {
                    component.renderSingleItemDelay(item.id);
                    // a.push(item)
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