import { ergodicTree, genUniqueId } from '../utils/NormalUtils';
import { TextRenderScopeStrategy } from './TextRenderScope';
import { BasicRenderer } from './BasicRenderer';
import { replaceNodes } from '../utils/DomHelper';
import { ScopeType } from '../enum/ScopeType';
import { ProxyAdaptor } from './ProxyAdaptor';
import { EventRenderScopeStrategy } from './EventRenderScope';
import { SubRendererParam } from '../interface/SubRendererParam';
import { IteratedRenderScopeStrategy } from './IteratedRenderScope';
import { BindRenderScopeStrategy } from './BindRenderScope';
import { ChoiceRenderScopeStrategy } from './ChoiceRenderScope';
import { ComponentRenderScopeStrategy } from './ComponentRenderScope';
import { TemplateRenderScopeStrategy } from './TemplateRenderScope';

const defaultOptions: any = {
    context: {},
    renderScopeStrategies: [
        new IteratedRenderScopeStrategy(),
        new ChoiceRenderScopeStrategy(),
        new TemplateRenderScopeStrategy(),
        new ComponentRenderScopeStrategy(),
        new BindRenderScopeStrategy(),
        new EventRenderScopeStrategy(),
        new TextRenderScopeStrategy()
    ]
};

export class ScentRenderer extends BasicRenderer<Node> {
    template: string;
    originElements: Node[];
    hasMounted: boolean = false;
    renderScopeStrategies: TextRenderScopeStrategy[];
    proxyAdaptor: ProxyAdaptor;
    replaceMounted: boolean = false;
    targetPlaceholderMapping = new Map<Node, Node>();

    constructor(options: any = {}) {
        super();
        let {
            template = undefined,
            context = undefined,
            renderScopeStrategies = [],
            mount = undefined,
            adaptor = undefined,
            autoMounted = true,
            replaceMounted = false
        } = { ...defaultOptions, ...options };

        this.renderScopeStrategies = renderScopeStrategies;
        this.replaceMounted = replaceMounted;

        if (adaptor) {
            this.proxyAdaptor = adaptor;
            adaptor.adapt(this, this.context);
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

        this.compile();
        if (autoMounted) {
            this.render();
            this.mount();
        }
    }

    compile(): void {
        // compile template to dom
        const tempDom = document.createElement('template');
        tempDom.innerHTML = this.template;
        this.virtualElement = (tempDom.cloneNode(true) as HTMLTemplateElement).content;
        ergodicTree(this.virtualElement)((node, parent, preventDeeply) => {
            let canGoDeep = true;
            for (let strategy of this.renderScopeStrategies) {
                let result = strategy.match(node as Element);
                if (result) {
                    const scopes = [];
                    if (!Array.isArray(result)) {
                        scopes.push(result);
                    } else {
                        scopes.push(...result);
                    }
                    scopes.forEach((scope) => {
                        scope.id = genUniqueId();
                        this.scopesMapper[scope.id] = scope;
                    });
                    if ([ScopeType.Alienated, ScopeType.Alienated_UNIQUE].includes(strategy.type)) {
                        canGoDeep = false;
                    }
                    if (strategy.type === ScopeType.Alienated_UNIQUE) {
                        break;
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
        if (!this.replaceMounted) {
            (this.virtualElement as DocumentFragment).append(...this.realElement.childNodes);
            replaceNodes([...this.realElement.childNodes], this.originElements, this.realElement);
        } else {
            replaceNodes(this.originElements, this.realElement);
            (this.virtualElement as DocumentFragment).append(...this.originElements);
        }
        this.hasMounted = false;
    }

    public mount(target?: Node): void {
        if (this.hasMounted) {
            return;
        }
        this.realElement = target || this.realElement;
        if (!this.replaceMounted) {
            // copy realElement to originElement & clear all children
            this.originElements = [...this.realElement.childNodes];
            replaceNodes(this.originElements, this.virtualElement, this.realElement);
        } else {
            this.originElements = [...this.virtualElement.childNodes];
            replaceNodes(this.realElement, this.virtualElement);
        }
        this.hasMounted = true;
    }

    checkToReplaceSubRenderers(renderId: string, target: Node, replaceParent: boolean): void {
        const subRenderers = this.renderIdChildrenMapping[renderId] || [];
        const noPlacedElements = (subRenderers as ScentRenderer[])
            .filter((subRenderer) => !subRenderer.realElement.parentNode && !subRenderer.hasMounted)
            .map((subRenderer) => {
                return subRenderer.realElement;
            });
        if (replaceParent) {
            let placeholder = this.targetPlaceholderMapping.get(target);
            if (!placeholder) {
                placeholder = document.createComment(`${renderId}-placeholder`);
                replaceNodes(target, placeholder);
                this.targetPlaceholderMapping.set(target, placeholder);
            }
            if (noPlacedElements.length > 0) {
                replaceNodes(placeholder, [...noPlacedElements, placeholder], placeholder.parentNode);
            }
        }
        // filter subRenderers are not mounted
        (subRenderers as ScentRenderer[])
            .filter((subRenderer) => {
                return !subRenderer.hasMounted;
            })
            .forEach((subRenderer) => {
                subRenderer.render();
                subRenderer.mount();
            });
    }

    genSubRenderer(param: SubRendererParam, target: Node | undefined): ScentRenderer {
        const realElement = document.createComment('--sub-renderers--');
        if (target) {
            target.appendChild(realElement);
        }
        return new ScentRenderer({
            template: param.template,
            context: param.context,
            renderScopeStrategies: this.renderScopeStrategies,
            mount: realElement,
            autoMounted: false,
            replaceMounted: true
        });
    }
}
