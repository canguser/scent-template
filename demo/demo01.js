var { HtmlRenderer } = window.scent.template;

var context = react({
    name: 'Ryan',
    age: 25
});

var component = new HtmlRenderer({
    element: document.querySelector('.app'), context: convertContext(context)
});

var identityList = [];
var identityItemMapping = Object.create(null);

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

component.mount('.app');

function react(obj) {
    return new Proxy(obj, {
        set(target, p, value, receiver) {
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

function convertContext(context) {
    return new Proxy(context, {
        get(target, p, receiver) {
            identityList.push(p);
            return Reflect.get(target, p, receiver);
        }
    });
}

document.body.addEventListener('click', () => {
    context.name += 'dsada';
});

const d = {
    mounted({ dom, value, key }) {
        if (value && dom.parentElement) {
            const commentsEle = document.createComment('id');
            dom.parentElement.replaceChild(commentsEle, dom);
        }
    }
};