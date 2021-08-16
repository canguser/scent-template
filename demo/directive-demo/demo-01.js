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
                return (params.result || []).reduce(
                    (r, item, i, list) => {
                        Object.assign(r, template.from(i, {
                            get [params.attributeValue]() {
                                return list[i];
                            }
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
    numbers: [1, 2, 3, 4, 5, 6]
});

renderer.afterRendered(() => {
    console.log('rendered');
});

// renderer.mount();
// renderer.renderAll();

renderer.renderAll().then(() => renderer.mount());


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

