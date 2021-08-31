import { HtmlRenderer, reactContext, unProxy } from '..';

export interface ComponentOptions {
    data?(): any

    props?: string[]

    render?(): string | Element

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
    data(): any {
        return {};
    },

    props: [],

    render(): string {
        return '<template></template>';
    },

    created(): void {
    },

    mounted(): void {
    },

    destroyed(): void {
    }
};

export function defineComponent(name, options: ComponentOptions) {
    options = { ...defaultOptions, ...options };

    const { props, data, mounted, render } = options;

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
                const ele = document.createElement('div');
                if (typeof renderedHtml === 'string') {
                    ele.innerHTML = renderedHtml;
                } else if (renderedHtml.nodeType === Node.ELEMENT_NODE) {
                    ele.appendChild(renderedHtml);
                }
                const shadow = this.attachShadow({ mode: 'open' });
                shadow.appendChild(ele);
                this.renderer = new HtmlRenderer({ element: ele });
                this.context = reactContext(this.renderer, new Context(this, this.renderer, data()));
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

}