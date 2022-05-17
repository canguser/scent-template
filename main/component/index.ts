import { toDashName, traversingTreeNode } from '../utils/NormalUtils';
import { BasicStrategy } from '../stragtegies/BasicStrategy';
import { StrategyType } from '../enum/StrategyType';
import { clearNodeAttribute, getAttrObject, getNodeAttribute } from '../utils/DomHelper';
import { AdaptedContext, configuration, ScopeManager } from '@scent/core';
import { Context } from '@scent/core/typing/context/Context';

class ComponentInstance {
    private refContextMap: Map<string, any> = new Map();

    constructor(public target: Element) {}

    getSubContextByRef(ref: string): any {
        return this.refContextMap.get(ref);
    }

    setSubContextByRef(ref: string, context: any) {
        this.refContextMap.set(ref, context);
    }

    async nextTick(fn: () => void) {
        const adaptor = configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
        return adaptor?.nextTick?.(fn) || fn();
    }
}

export interface ComponentFnOptions {
    slotsParent?: Element;
    alias?: string;
    parentInstance?: ComponentInstance;
    refName?: string;
}

export type ComponentFn = (props: any, options?: ComponentFnOptions) => Element;

export interface ComponentOptions {
    name?: string;
    components?: {
        [key: string]: ComponentFn;
    };
    template: string;
    setup?: (props: any, instance?: ComponentInstance) => object;
}

export interface RenderStrategyOptions {
    components?: {
        [key: string]: ComponentFn;
    };
    target: DocumentFragment;
    context: Context;
    slotsParent?: Element;
    instance?: ComponentInstance;
}

function renderComponent(
    target: Element,
    components: {
        [key: string]: ComponentFn;
    },
    parentComponent: ComponentInstance
) {
    const dashedComponents = {};
    Object.keys(components).forEach((key) => {
        dashedComponents[toDashName(key)] = components[key];
    });
    if (target.nodeType === Node.ELEMENT_NODE) {
        const adaptor = configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
        for (const key in dashedComponents) {
            if ((target.tagName || '').toLowerCase() === key) {
                const componentFn = dashedComponents[key];
                const props = getAttrObject(target);
                const reactProps = (target['_bindAttr'] = adaptor.create(props));
                const component = componentFn(reactProps, {
                    slotsParent: target,
                    parentInstance: parentComponent,
                    alias: key,
                    refName: target.getAttribute('ref')
                });
                target.parentNode.replaceChild(component, target);
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
    const { target, components, context, instance } = options;
    const _strategies = configuration.get<BasicStrategy[]>('strategies') || [];
    const results: string[] = [];
    traversingTreeNode(target, 'childNodes', (node) => {
        let canGoDeep = true;
        renderComponent(node, components || {}, instance);
        if (renderSlots(node, options.slotsParent)) {
            return false;
        }
        for (let strategy of _strategies) {
            let result = strategy.match(node as Element, context, (_target, _context) => {
                return renderByStrategy({
                    ...options,
                    target: _target,
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
    return (props: any, fnOptions?: ComponentFnOptions) => {
        const { slotsParent, parentInstance, refName, alias } = fnOptions || {};
        props = props || {};
        const adaptor = configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
        const template = document.createElement('template');
        template.innerHTML = options.template;
        const readonlyProps = adaptor.create(props, true);
        const component = document.createElement(alias || options.name || 'App');
        const instance = new ComponentInstance(component);
        const context = new AdaptedContext({
            ...options.setup?.call?.(instance, readonlyProps, instance),
            $props: readonlyProps
        });
        const result = template.content;
        renderByStrategy({
            target: result,
            components: options.components,
            context,
            slotsParent,
            instance
        });
        if (parentInstance && refName) {
            parentInstance.setSubContextByRef(refName, adaptor.create(context.contextGetter(), true));
        }
        component.appendChild(result);
        return component;
    };
}
