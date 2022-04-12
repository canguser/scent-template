import { RenderScope } from '../interface/RenderScope';
import { template } from '@rapidly/utils/lib/commom/string/template';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';

export class TextRenderScope implements RenderScope {
    target: any;
    expression: any;

    constructor(target: any, expression: any) {
        this.target = target;
        this.expression = expression;
    }

    render(context: () => object) {
        this.target.textContent = template(this.expression, context(), { withFunction: true });
    }
}

export class TextRenderScopeStrategy implements RenderScopeStrategy<Element> {

    identityName = 'text';

    match(target: Element): RenderScope<Element> | false {
        if (target.nodeType === Node.TEXT_NODE && target.parentNode.nodeType !== Node.COMMENT_NODE) {
            const text = target.textContent;
            if (text.trim()){
                return new TextRenderScope(target, target.textContent);
            }
        }
        return false;
    }

    type: ScopeType = ScopeType.Inherited;
}
