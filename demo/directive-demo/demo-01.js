const { HtmlRenderer, reactContext } = window.scent.template;

const renderer = new HtmlRenderer({
    element: '#app'
});

const context = reactContext(renderer, {
    name: 'ryan',
    gender: 'male',
    age: '25',
    schools: [
        {
            name: '高平镇小学',
            year: 2005
        },
        {
            name: '高平镇中学',
            year: 2010
        },
        {
            name: '金雁中学',
            year: 2014
        },
        {
            name: '四川旅游学院',
            year: 2016
        }
    ],
    numbers: [1, 2, 3, 4, 5, 6],
    onclick() {
        this.numbers.push(this.numbers.length);
    }
});

renderer.afterRendered(() => {
    console.log('rendered');
});

// renderer.mount();
// renderer.renderAll();

renderer.renderAll().then(() => renderer.mount());
