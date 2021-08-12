const { HtmlRenderer, reactContext } = window.scent.template;

const renderer = new HtmlRenderer({
    element: '.app'
});


const context = reactContext(renderer, {
    name: 'ryan',
    gender: 'male',
    age: '25'
});

console.time('rendered');

renderer.nextTick(() => {
    console.timeEnd('rendered');
});

renderer.afterRendered(() => {
    console.log('rendered');
});

renderer.mount();
