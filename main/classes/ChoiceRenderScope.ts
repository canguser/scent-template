import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';
import { genUniqueId } from '../utils/NormalUtils';

export class ChoiceRenderScope implements RenderScope {
    expression: string;
    target: any;
    lastShow: boolean = false;
    lastIdentity: string;

    constructor(expression: string, target: any) {
        this.expression = expression;
        this.target = target;
    }

    render(context: () => object): RenderResult {
        const render = !!execExpression(this.expression, context());
        const identity = this.lastShow && render ? this.lastIdentity : genUniqueId();
        this.lastShow = render;
        return {
            replaceParent: true,
            rendererParams: render
                ? [
                      {
                          identity,
                          template: this.target,
                          context: context()
                      }
                  ]
                : []
        };
    }
}

export class ChoiceRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated_UNIQUE;

    key: string = 's-if';

    identityName = 'choice';

    match(target: Element): RenderScope<Element> | false {
        if (!target.hasAttribute?.(this.key)) return false;
        const expression = target.getAttribute(this.key);
        target.removeAttribute(this.key);
        return new ChoiceRenderScope(expression, target);
    }
}
