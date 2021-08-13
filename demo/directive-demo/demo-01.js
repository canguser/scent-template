const { HtmlRenderer, reactContext } = window.scent.template;

const renderer = new HtmlRenderer({
    element: '#app',
    directives: [
        {
            name: 'if',
            isScoped: true,
            defineTemplates(template, params) {
                if (!params.result) {
                    return {};
                }
                return {
                    ...template.from(0)
                };
            },
            render({ params, target, trans = {} }) {
            }
        },
        {
            name: 'for',
            isScoped: true,
            defineTemplates(template, params) {
                return params.result.reduce(
                    (r, item, i) => {
                        Object.assign(r, template.from(i, {
                            [params.attributeValue]: item
                        }));
                        return r;
                    }, {}
                );
            }
        }
    ]
});

const context = reactContext(renderer, {
    name: 'ryan',
    gender: 'male',
    age: '25',
    schools: ['bj', 'bl']
});

renderer.afterRendered(() => {
    console.log('rendered');
});

renderer.mount();
renderer.renderAll();

const ifd = {

    isScoped: true,

    defineTemplate(
        {
            value,
            attribute,
            scopeTemplate
        }
    ) {
        return [
            scopeTemplate.from(0, {})
        ];
    },

    defineScopes(
        {
            value,
            attribute
        }
    ) {
    }

};

