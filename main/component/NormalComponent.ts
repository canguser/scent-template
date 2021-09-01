import { HtmlRenderer, reactContext, unProxy, pathJoin, urlJoin } from '..';

const globalDom = [];

export interface ComponentOptions {

    dependencies: string[],

    data?(): any

    common?: { [key: string]: any }

    props?: string[]

    render?(): string | Element | any

    style?(): string

    created?(): void

    mounted?(): void

    destroyed?(): void
}

export class Context {

    [p: string]: any

    constructor(private $root, private $renderer, data) {
        Object.assign(this, data);
    }

    $emit(event: string, payload?: any) {
        const root = unProxy(this.$root);
        root.dispatchEvent(new CustomEvent(event, { detail: { value: payload } }));
    }
}

const defaultOptions: ComponentOptions = {

    dependencies: [],

    data(): any {
        return {};
    },

    props: [],

    common: {},

    render(): string {
        return '<template></template>';
    },

    style(): string {
        return null;
    },

    created(): void {
    },

    mounted(): void {
    },

    destroyed(): void {
    }
};

export async function defineComponent(name, options: ComponentOptions, path = location.href) {
    options = { ...defaultOptions, ...options };

    const { props, data, mounted, render, style, common, dependencies } = options;

    if (dependencies && dependencies.length > 0) {
        await Promise.all(dependencies.map(d => importComponent(d, path)));
    }

    customElements.define(
        name, class extends HTMLElement {

            renderer: HtmlRenderer;
            context: any;

            static get observedAttributes() {
                return props;
            }

            constructor() {
                super();
                const renderedHtml = render();
                const ele = document.createElement('template');
                if (typeof renderedHtml === 'string') {
                    ele.innerHTML = renderedHtml;
                } else if ([Node.ELEMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(renderedHtml.nodeType)) {
                    ele.content.appendChild(renderedHtml.cloneNode(true));
                }
                const shadow = this.attachShadow({ mode: 'open' });
                for (const dom of globalDom) {
                    shadow.appendChild(document.importNode(dom.content, true));
                }
                const sty = style();
                if (sty) {
                    const styleEle = document.createElement('style');
                    styleEle.innerHTML = sty;
                    shadow.appendChild(styleEle);
                }
                shadow.appendChild(ele);
                this.renderer = new HtmlRenderer({ element: ele });
                this.context = reactContext(this.renderer, new Context(this, this.renderer, {
                    ...common,
                    ...data()
                }));
                this.renderer.renderAll()
                    .then(() => this.renderer.mount());
            }

            attributeChangedCallback(name, oldValue, newValue) {
                if (props.includes(name)) {
                    if (newValue === undefined || newValue === 'undefined') {
                        newValue = this.context[name];
                    }
                    if (oldValue !== newValue) {
                        this.context[name] = newValue;
                    }
                }
            }
        }
    );

    console.log(`Component ${name} declared.`);

}

function _componentOptions(name: string, options: ComponentOptions) {
    return [name, options];
}

export async function importComponent(url: string, basePath = location.href) {
    url = urlJoin(basePath, url);
    const response = await fetch(url);
    const html = await response.text();
    const template = document.createElement('template');
    template.innerHTML = html;
    const ele = template.content;
    const childNodes = [...ele.childNodes];
    const scripts = childNodes.filter(ele => ele.nodeName === 'SCRIPT');
    const styles = childNodes.filter(ele => ele.nodeName === 'STYLE');
    const templates = childNodes.filter(ele => ele.nodeName === 'TEMPLATE');

    const styleString = styles.map(s => s.textContent).join('\n');

    const targetTemplate = document.createElement('template');
    for (const t of templates) {
        targetTemplate.content.appendChild(t);
    }

    for (const script of scripts) {
        const defineFunc = new Function('defineComponent', script.textContent || '');
        let name;
        let options;
        defineFunc((n, o) => {
            name = n;
            options = o;
        });
        if (name) {
            defineComponent(name, {
                style(): string {
                    return styleString;
                },
                render(): string | Element | any {
                    return targetTemplate.content;
                },
                ...options
            }, url);
        }
    }


}

export function defineGlobal(domString: string) {
    const template = document.createElement('template');
    template.innerHTML = domString;
    globalDom.push(template);
}