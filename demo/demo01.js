var { HtmlRenderer } = window.scent.template;

console.time('start');

var context = react({
    name: 'Ryan',
    age: 25
});

var component = new HtmlRenderer($0, convertContext(context));

var identityList = [];
var identityItemMapping = Object.create(null);

component.afterItemRendered(item => {
    console.log('on single item rendered');
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

component.afterRendered(() => {
    console.log('on rendered');
    console.timeEnd('start');
});


function react(obj) {
    return new Proxy(obj, {
        set(target, p, value, receiver) {
            const result = Reflect.set(target, p, value, receiver);
            const items = identityItemMapping[p] || [];
            for (const item of items) {
                component.renderSingleItemDelay(item.id);
            }
            return result;
        }
    });
}

function convertContext(context) {
    return new Proxy(context, {
        get(target, p, receiver) {
            identityList.push(p);
            return Reflect.get(target, p, receiver);
        }
    });
}