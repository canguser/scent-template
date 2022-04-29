import { AdaptedContext } from '../context/AdaptedContext';
import { configuration } from '../configure';
import { ScopeManager } from '../scopes/ScopeManager';
import { toDashName, traversingTreeNode } from '../utils/NormalUtils';
import { BasicStrategy } from '../stragtegies/BasicStrategy';
import { StrategyType } from '../enum/StrategyType';
import { Context } from '../context/Context';
import { clearNodeAttribute, getNodeAttribute } from '../utils/DomHelper';

export type ComponentFn = (props: any, slotsParent?: Element) => DocumentFragment;

export interface ComponentOptions {
    components?: {
        [key: string]: ComponentFn;
    };
    template: string;
    setup?: (props, target?: any) => object;
}

export interface RenderStrategyOptions {
    components?: {
        [key: string]: ComponentFn;
    };
    target: DocumentFragment;
    context: Context;
    slotsParent?: Element;
}

function renderComponent(
    target: Element,
    components: {
        [key: string]: ComponentFn;
    }
) {
    const dashedComponents = {};
    Object.keys(components).forEach((key) => {
        dashedComponents[toDashName(key)] = components[key];
    });
    if (target.nodeType === Node.ELEMENT_NODE) {
        for (const key in dashedComponents) {
            if ((target.tagName || '').toLowerCase() === key) {
                const componentFn = dashedComponents[key];
                const component = componentFn({}, target);
                const ele = document.createElement(key);
                ele.appendChild(component);
                target.parentNode.replaceChild(ele, target);
                return true;
            }
        }
    }
    return false;
}

function renderSlots(target: Element, slotsParent?: Element) {
    if (slotsParent) {
        if (target.nodeType === Node.ELEMENT_NODE && target.tagName.toLowerCase() === 'slot') {
            const slotName = target.getAttribute('name') || '';
            const fragment = document.createDocumentFragment();
            for (const node of [...slotsParent.childNodes]) {
                if (
                    node.nodeType === Node.ELEMENT_NODE ||
                    node.nodeType === Node.TEXT_NODE ||
                    node.nodeType === Node.COMMENT_NODE
                ) {
                    const slotNameAttr = getNodeAttribute(node, 'slot') || '';
                    if (slotNameAttr === slotName) {
                        clearNodeAttribute(node, 'slot');
                        fragment.appendChild(node);
                    }
                }
            }
            if (fragment.childNodes.length > 0) {
                target.parentNode.replaceChild(fragment, target);
                return true;
            }
        }
    }
    return false;
}

export function renderByStrategy(options: RenderStrategyOptions): string[] {
    const { target, components, context } = options;
    const _strategies = configuration.get<BasicStrategy[]>('strategies') || [];
    const results: string[] = [];
    traversingTreeNode(target, 'childNodes', (node) => {
        let canGoDeep = true;
        renderComponent(node, components || {});
        if (renderSlots(node, options.slotsParent)) {
            return false;
        }
        for (let strategy of _strategies) {
            let result = strategy.match(node as Element, context, (_target, _context) => {
                return renderByStrategy({
                    target: _target,
                    components,
                    context: _context || context
                });
            });
            if (result) {
                results.push(...result);
                if ([StrategyType.Alienated, StrategyType.Alienated_UNIQUE].includes(strategy.type)) {
                    canGoDeep = false;
                }
                if (strategy.type === StrategyType.Alienated_UNIQUE) {
                    break;
                }
            }
        }
        return canGoDeep;
    });
    return results;
}

export function defineComponent(options: ComponentOptions): ComponentFn {
    return (props: any, slotsParent?: Element) => {
        props = props || {};
        const adaptor = configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
        const template = document.createElement('template');
        template.innerHTML = options.template;
        const context = new AdaptedContext({
            ...options.setup?.(props),
            $props: adaptor.create(props, true)
        });

        const result = template.content;

        renderByStrategy({ target: result, components: options.components, context, slotsParent });

        return result;
    };
}
