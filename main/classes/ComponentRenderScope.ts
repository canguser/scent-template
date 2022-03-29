import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { Component } from '../interface/common';
import { toDashName } from '../utils/NormalUtils';

export class ComponentRenderScope implements RenderScope {
    expression: string;
    target: any;
    attributes: any = {};
    component: Component;
    newContext: object;
    strategy: ComponentRenderScopeStrategy;

    constructor(target: any, component: Component, strategy: ComponentRenderScopeStrategy) {
        this.component = component;
        this.target = target;
        this.attributes = target._bindAttr || (target._bindAttr = {});
        this.newContext = this.component.data?.(this.attributes, this.target) || {};
        this.strategy = strategy;
    }

    render(context: object): void | RenderResult {
        return {
            replaceParent: false,
            rendererParams: [
                {
                    template: this.component.template,
                    context: new Proxy(this.newContext || {}, {
                        get: (target, key) => {
                            if (key === '$props') {
                                return new Proxy(this.attributes, {
                                    set: (target, key, value) => {
                                        console.warn(`Attribute`, key, `is readonly.`);
                                        return true;
                                    }
                                });
                            }
                            return Reflect.get(target, key);
                        },
                        set: (target, key, value) => {
                            if (key === '$props') {
                                console.warn(`Attribute`, key, `is readonly.`);
                                return true;
                            }
                            return Reflect.set(target, key, value);
                        }
                    }),
                    scopeOptions: {
                        [this.strategy.identityName]: {
                            components: this.component.components || {}
                        }
                    }
                }
            ]
        };
    }
}

export class ComponentRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated;

    identityName = 'component';

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
        }
        return false;
    }
}
