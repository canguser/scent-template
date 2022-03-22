import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';

export class ChoiceRenderScope implements RenderScope {
    expression: string;
    target: any;

    constructor(expression: string, target: any) {
        this.expression = expression;
        this.target = target;
    }

    render(context: object): RenderResult {
        const render = !!execExpression(this.expression, context);
        return {
            replaceParent: true,
            rendererParams: render
                ? [
                      {
                          identity: this.target,
                          template: this.target,
                          context
                      }
                  ]
                : []
        };
    }
}

export class ChoiceRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated_UNIQUE;

    key: string = 's-if';

    match(target: Element): RenderScope<Element> | false {
        if (!target.hasAttribute?.(this.key)) return false;
        const expression = target.getAttribute(this.key);
        target.removeAttribute(this.key);
        return new ChoiceRenderScope(expression, target);
    }
}
