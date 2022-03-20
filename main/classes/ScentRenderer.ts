import { ergodicTree, genUniqueId } from '../utils/NormalUtils';
import { TextRenderScopeStrategy } from './TextRenderScope';
import { BasicRenderer } from './BasicRenderer';
import { replaceNode } from '../utils/DomHelper';
import { ScopeType } from '../enum/ScopeType';
import { ProxyAdaptor } from './ProxyAdaptor';

const defaultOptions: any = {
    context: {},
    renderScopeStrategies: [new TextRenderScopeStrategy()]
};

export class ScentRenderer extends BasicRenderer<Node> {
    template: string;
    originElements: Node[];
    hasMounted: boolean = false;
    renderScopeStrategies: TextRenderScopeStrategy[];
    proxyAdaptor: ProxyAdaptor;

    constructor(options: any = {}) {
        super();
        let {
            template = undefined,
            context = undefined,
            renderScopeStrategies = [],
            mount = undefined,
            adaptor = undefined
        } = { ...defaultOptions, ...options };

        this.renderScopeStrategies = renderScopeStrategies;

        if (adaptor){
            this.proxyAdaptor = adaptor;
            adaptor.adapt(this);
        }

        if (typeof mount === 'string') {
            mount = document.querySelector(mount);
        }

        if (template) {
            if (typeof template === 'string') {
                this.template = template;
            } else {
                this.template = template.outerHTML;
            }
        } else if (mount) {
            this.template = mount.outerHTML;
        }

        if (mount) {
            this.realElement = mount;
        }

        this.context = context;

        this.init();
    }

    init() {
        this.compile();
        this.render();
        this.mount();
    }

    compile(): void {
        // compile template to dom
        const tempDom = document.createElement('template');
        tempDom.innerHTML = this.template;
        this.virtualElement = (tempDom.cloneNode(true) as HTMLTemplateElement).content;
        ergodicTree(this.virtualElement)((node, parent, preventDeeply) => {
            let canGoDeep = true;
            for (let strategy of this.renderScopeStrategies) {
                const result = strategy.match(node);
                if (result) {
                    const scope = result;
                    scope.id = genUniqueId();
                    this.scopesMapper[scope.id] = scope;
                    if (strategy.type === ScopeType.Alienated) {
                        canGoDeep = false;
                    }
                }
            }
            if (!canGoDeep) {
                preventDeeply();
            }
        });
    }

    public unmount(): void {
        if (!this.hasMounted) {
            return;
        }
        this.children.forEach((child) => {
            child.unmount();
        });
        replaceNode(this.virtualElement, [...this.realElement.childNodes]);
        replaceNode([...this.realElement.childNodes], this.originElements, this.realElement);
        this.hasMounted = false;
    }

    public mount(target?: Node): void {
        if (this.hasMounted) {
            return;
        }
        this.realElement = target || this.realElement;
        // copy realElement to originElement & clear all children
        this.originElements = [...this.realElement.childNodes];
        replaceNode(this.originElements, this.virtualElement, this.realElement);
        this.children.forEach((child) => {
            child.mount();
        });
        this.hasMounted = true;
    }
}
