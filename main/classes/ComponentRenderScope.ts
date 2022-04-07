import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { Component } from '../interface/common';
import { toDashName } from '../utils/NormalUtils';
import { ScentRenderer } from './ScentRenderer';
import { replaceNode, unmountDom } from '../utils/DomHelper';

class ComponentInstance {
    constructor(public target: Element, private scope: ComponentRenderScope) {}

    getRef(ref: string) {
        const renderer = this.scope.strategy?.renderer;
        const currentRenderer = renderer?.children.find(item => item.renderScope = this.scope) as ScentRenderer;
        if (currentRenderer) {
            const scopes = currentRenderer.getChildrenSpecifiedScopes(ComponentRenderScope) as ComponentRenderScope[];
            const scope = scopes.find((c) => c.ref === ref);
            if (scope) {
                return currentRenderer.proxyAdaptor?.create?.(scope.newContext, true) || scope.newContext;
            }
        }
        return null;
    }
}

export class ComponentRenderScope implements RenderScope {
    expression: string;
    target: any;
    attributes: any = {};
    component: Component;
    newContext: object;
    strategy: ComponentRenderScopeStrategy;
    slotMapping: { [key: string]: DocumentFragment } = {};
    ref: string;

    constructor(target: any, component: Component, strategy: ComponentRenderScopeStrategy) {
        this.component = component;
        this.target = target;
        const attribute = target._bindAttr || (target._bindAttr = strategy.renderer?.proxyAdaptor?.create?.({}) || {});
        this.attributes = strategy.renderer?.proxyAdaptor?.create?.(attribute, true) || attribute;
        const newContext = {
            ...(this.component.data?.(this.attributes, new ComponentInstance(this.target, this)) || {}),
            $props: this.attributes
        };
        this.newContext = strategy.renderer?.proxyAdaptor?.create?.(newContext) || newContext;
        this.strategy = strategy;
        this.ref = target.getAttribute('ref');
        if (this.target) {
            const children = [...this.target.childNodes].filter(
                (node) => node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE
            );
            if (children.length > 0) {
                const defaultSlots = (this.slotMapping['body'] = document.createDocumentFragment());
                for (const child of children) {
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim() === '') {
                        continue;
                    }
                    const slotName = child?.getAttribute?.('slot');
                    if (slotName === '' || slotName == null || slotName === 'body') {
                        defaultSlots.appendChild(child);
                    } else {
                        let slots = this.slotMapping[slotName] || document.createDocumentFragment();
                        slots.appendChild(child);
                        this.slotMapping[slotName] = slots;
                    }
                    // remove all slot attribute
                    child?.removeAttribute?.('slot');
                }
            }
        }
    }

    render(context: object): void | RenderResult {
        return {
            replaceParent: false,
            rendererParams: [
                {
                    template: this.component.template,
                    context: this.newContext,
                    scopeOptions: {
                        [this.strategy.identityName]: {
                            components: {
                                ...this.strategy.configs.components,
                                ...(this.component.components || {})
                            }
                        }
                    }
                }
            ]
        };
    }
}

class SlotRenderScope implements RenderScope<Element> {
    target: Element;
    element: DocumentFragment;

    constructor(target: Element, element: DocumentFragment) {
        this.target = target;
        this.element = element;
    }

    render(): void {
        if (this.target.parentNode) {
            const childNodes: Element[] = [...this.element.childNodes] as Element[];
            if (childNodes.length === 0) {
                const targetChildren = [...this.target.childNodes];
                if (targetChildren.length === 0){
                    unmountDom(this.target);
                }else {
                    replaceNode(this.target, [...this.target.childNodes]);
                }
            } else {
                replaceNode(this.target, this.element);
            }
        }
    }
}

export class ComponentRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Inherited;

    identityName = 'component';
    renderer: ScentRenderer;

    constructor(renderer: ScentRenderer) {
        this.renderer = renderer;
    }

    configs: {
        components?: { [key: string]: Component };
    } = {};

    setConfigs(configs: any) {
        this.configs = configs;
    }

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        const { components = {} } = this.configs || {};
        const dashedComponents = {};
        Object.keys(components).forEach((key) => {
            dashedComponents[toDashName(key)] = components[key];
        });
        if (target.nodeType === Node.ELEMENT_NODE) {
            for (const key in dashedComponents) {
                if ((target.tagName || '').toLowerCase() === key) {
                    const component = dashedComponents[key];
                    return new ComponentRenderScope(target, component, this);
                }
            }
            if (target.tagName.toLowerCase() === 'slot') {
                const parentComponentScope = this.renderer.getLatestSpecifiedScope(
                    ComponentRenderScope
                ) as ComponentRenderScope;
                if (parentComponentScope) {
                    const slotMapping = parentComponentScope.slotMapping;
                    const slotName = target.getAttribute('name') || 'body';
                    const slots = slotMapping[slotName] || document.createDocumentFragment();
                    return new SlotRenderScope(target, slots);
                }
            }
        }
        return false;
    }
}
