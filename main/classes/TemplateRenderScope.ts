import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';

export class TemplateRenderScope implements RenderScope {
    expression: string;
    target: any;

    constructor(target: any) {
        this.target = target;
    }

    render(): void | RenderResult {
        return {
            replaceParent: true,
            rendererParams: [
                {
                    template: this.target.innerHTML
                }
            ]
        };
    }
}

export class TemplateRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated_UNIQUE;

    identityName = 'template';

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        if (target.nodeType === Node.ELEMENT_NODE && (target.tagName || '').toLowerCase() === 'template') {
            return new TemplateRenderScope(target);
        }
        return false;
    }
}
