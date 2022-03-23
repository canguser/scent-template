import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';

export class ComponentRenderScope implements RenderScope {
    expression: string;
    target: any;
    newContext: object;

    constructor(template: string, target: any, newContext: object) {
        this.expression = template;
        this.target = target;
        this.newContext = newContext;
    }

    render(context: object): void | RenderResult {
        return {
            replaceParent: false,
            rendererParams: [
                {
                    template: this.expression,
                    context: this.newContext
                },
                {
                    template: this.expression,
                    context: {
                        name: '231'
                    }
                },
            ]
        };
    }
}

export class ComponentRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated;

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        if (target.nodeType === Node.ELEMENT_NODE && (target.tagName || '').toLowerCase() === 'c-component') {
            return new ComponentRenderScope(`<div>{name}</div>`, target, {
                name: 'Component'
            });
        }
        return false;
    }
}
