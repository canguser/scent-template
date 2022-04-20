import { ergodicTree, genUniqueId, traversingTreeNode } from '../utils/NormalUtils';
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
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ModelRenderScopeStrategy } from '../scopes/ModelRenderScope';
import { RenderScope } from '../interface/RenderScope';

const defaultOptions: any = {
    context: {},
    renderScopeStrategiesDef: [
        {
            identity: 'iterated',
            class: IteratedRenderScopeStrategy
        },
        {
            identity: 'choice',
            class: ChoiceRenderScopeStrategy
        },
        {
            identity: 'template',
            class: TemplateRenderScopeStrategy
        },
        {
            identity: 'component',
            class: ComponentRenderScopeStrategy
        },
        {
            identity: 'model',
            class: ModelRenderScopeStrategy
        },
        {
            identity: 'bind',
            class: BindRenderScopeStrategy
        },
        {
            identity: 'text',
            class: TextRenderScopeStrategy
        },
        {
            identity: 'event',
            class: EventRenderScopeStrategy
        }
    ]
};

export class ScentRenderer extends BasicRenderer<Node> {
    template: string;
    originElements: Node[];
    hasMounted: boolean = false;
    replaceMounted: boolean = false;
    targetPlaceholderMapping = new Map<Node, Node>();
    parent: ScentRenderer;

    _proxyAdaptor: ProxyAdaptor;
    _renderScopeStrategies: RenderScopeStrategy<Node>[] = [];
    renderScopeStrategiesDef = [];

    constructor(options: any = {}) {
        super();
        let {
            template = undefined,
            context = undefined,
            renderScopeStrategiesDef = undefined,
            mount = undefined,
            adaptor = undefined,
            autoInit = true,
            replaceMounted = false,
            scopeOptions = {},
            buildScopeStrategies = true
        } = { ...defaultOptions, ...options };

        if (renderScopeStrategiesDef) {
            this.renderScopeStrategiesDef = renderScopeStrategiesDef;
            if (buildScopeStrategies) {
                this.renderScopeStrategies = renderScopeStrategiesDef.map((renderScopeStrategyDef: any) => {
                    let { identity, class: RenderScopeStrategyClass } = renderScopeStrategyDef;
                    const instance = new RenderScopeStrategyClass(this);
                    instance.identityName = identity;
                    return instance;
                });
            }
        }
        this.replaceMounted = replaceMounted;
        this.context = context;

        if (adaptor) {
            this.proxyAdaptor = adaptor;
            this.context = adaptor.create(this.context);
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
            this.template = this.replaceMounted ? mount.outerHTML : mount.innerHTML;
        }

        if (mount) {
            this.realElement = mount;
        }

        Object.keys(scopeOptions).forEach((key) => {
            this.setScopeOption(key, scopeOptions[key]);
        });

        if (autoInit) {
            this.init();
        }
    }

    get renderScopeStrategies() {
        const strategies = this._renderScopeStrategies || [];
        const parentStrategies = this.parent ? this.parent.renderScopeStrategies : [];
        if (!parentStrategies.length) {
            return strategies;
        }
        return parentStrategies.map((strategy) => {
            const replaceStrategy = strategies.find((s) => s.identityName === strategy.identityName);
            if (replaceStrategy) {
                return replaceStrategy;
            }
            return strategy;
        });
    }

    set renderScopeStrategies(renderScopeStrategies: RenderScopeStrategy<Node>[]) {
        this._renderScopeStrategies = renderScopeStrategies;
    }

    get proxyAdaptor() {
        const adaptor = this._proxyAdaptor;
        if (!adaptor && this.parent) {
            return this.parent.proxyAdaptor;
        }
        return adaptor;
    }

    set proxyAdaptor(proxyAdaptor: ProxyAdaptor) {
        this._proxyAdaptor = proxyAdaptor;
    }

    setScopeOption(key: string, value: any) {
        const targetScopeStrategy = this.renderScopeStrategies.find((strategy) => strategy.identityName === key);
        if (targetScopeStrategy && typeof targetScopeStrategy.setConfigs === 'function') {
            targetScopeStrategy.setConfigs(value);
        }
    }

    setSelfScopeOption(key: string, value: any) {
        let selfScopeStrategy = this._renderScopeStrategies.find((strategy) => strategy.identityName === key);
        if (!selfScopeStrategy) {
            const def = this.renderScopeStrategiesDef.find((strategy) => strategy.identity === key);
            if (def) {
                selfScopeStrategy = new def.class(this);
                selfScopeStrategy.identityName = key;
                this._renderScopeStrategies.push(selfScopeStrategy);
            }
        }
        if (selfScopeStrategy && typeof selfScopeStrategy.setConfigs === 'function') {
            selfScopeStrategy.setConfigs(value);
        }
    }

    compile(): void {
        // compile template to dom
        const tempDom = document.createElement('template');
        tempDom.innerHTML = this.template;
        this.virtualElement = (tempDom.cloneNode(true) as HTMLTemplateElement).content;
        traversingTreeNode(this.virtualElement, 'childNodes', (node) => {
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
                    node['_scopes'] = scopes.map((scope) => scope);
                    if ([ScopeType.Alienated, ScopeType.Alienated_UNIQUE].includes(strategy.type)) {
                        canGoDeep = false;
                    }
                    if (strategy.type === ScopeType.Alienated_UNIQUE) {
                        break;
                    }
                }
            }
            return canGoDeep;
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
                return !subRenderer.hasMounted && !subRenderer.destroyed;
            })
            .forEach((subRenderer) => {
                subRenderer.init();
            });
    }

    genSubRenderer(param: SubRendererParam, target: Node | undefined): ScentRenderer {
        const realElement = document.createComment('--sub-renderers--' + genOrderedId());
        if (target) {
            // if target existing, means not to replace parent
            target.appendChild(realElement);
        }
        const renderer = new ScentRenderer({
            template: param.template,
            context: param.context,
            mount: realElement,
            autoInit: false,
            replaceMounted: true,
            buildScopeStrategies: false
        });
        if (param.scopeOptions) {
            Object.keys(param.scopeOptions).forEach((key) => {
                renderer.setSelfScopeOption(key, param.scopeOptions[key]);
            });
        }
        return renderer;
    }
}
