import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';

export class ComponentRenderScope implements RenderScope {
    expression: string;
    target: any;
    newContext: object;
    attributes: any = {};

    constructor(template: string, target: any, newContext: object) {
        this.expression = template;
        this.target = target;
        this.newContext = newContext;
        this.attributes = target._bindAttr || (target._bindAttr = {});
    }

    render(context: object): void | RenderResult {
        return {
            replaceParent: false,
            rendererParams: [
                {
                    template: this.expression,
                    context: new Proxy(this.newContext, {
                        get: (target, key) => {
                            if (key in this.attributes) {
                                return this.attributes[key];
                            }
                            return Reflect.get(target, key);
                        },
                        set: (target, key, value) => {
                            if (key in this.attributes) {
                                console.warn(`Attribute`, key, `is readonly.`);
                                return true;
                            }
                            return Reflect.set(target, key, value);
                        }
                    })
                }
            ]
        };
    }
}

export class ComponentRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated;

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        if (target.nodeType === Node.ELEMENT_NODE && (target.tagName || '').toLowerCase() === 'c-component') {
            return new ComponentRenderScope(`<div>{title}:{name}{content}</div>`, target, {
                name: 'Component'
            });
        }
        return false;
    }
}
