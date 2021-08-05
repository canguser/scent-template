var { WebComponent } = window.scent.template;

var context = react({
    name: 'Ryan',
    age: 25
});

var component = new WebComponent($0, convertContext(context));

var identityList = [];
var identityTextMapping = new Map();

component.onTextRendered((textNode) => {
    console.log('on single text rendered');
    for (const p of identityList) {
        let nodes = [];
        if (identityTextMapping.has(p)) {
            nodes = identityTextMapping.get(p) || [];
        }
        if (!nodes.includes(textNode)) {
            nodes.push(textNode);
        }
        identityTextMapping.set(p, nodes);
    }
    identityList = [];
});

component.afterRendered(() => {
    console.log('on rendered');
});


function react(obj) {
    return new Proxy(obj, {
        set(target, p, value, receiver) {
            const result = Reflect.set(target, p, value, receiver);
            const nodes = identityTextMapping.get(p) || [];
            for (const node of nodes) {
                component.renderSingleTextDelay(node);
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