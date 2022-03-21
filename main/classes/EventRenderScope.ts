import { RenderScope } from '../interface/RenderScope';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { execExpression } from '../utils/ExpressionHelper';
import { register, unregister } from '@rapidly/utils/lib/commom/dom/DomEvent';

export class EventRenderScope implements RenderScope {
    expression: string;
    target: any;
    eventName: string;

    eventHandlerId;

    constructor(expression: string, target: any, eventName: string) {
        this.expression = expression;
        this.target = target;
        this.eventName = eventName;
    }

    render(context: object): void {
        const func = execExpression(
            `
            (function($e){
                const result = (${this.expression});
                if (typeof result === 'function'){
                    return result.call(this, $e)
                }
            })
        `,
            context
        );

        if (this.eventHandlerId) {
            unregister(this.eventHandlerId);
        }

        this.eventHandlerId = register(this.target, this.eventName, (e) => {
            func.call(context, e);
        });
    }
}

export class EventRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Inherited;

    constructor(public prefixList: string[] = ['s-on', '@']) {}

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        // get all sub attributes nodes
        const attributes = target.attributes || [];
        // get all attributes nodes match prefix
        const attributeNodes = Array.from(attributes).filter((attr) =>
            this.prefixList.some((prefix) => attr.name.startsWith(prefix))
        );
        // generate render scopes from attribute nodes
        const renderScopes = attributeNodes.map((attr) => {
            const expression = attr.value;

            // get pre split prefix from attribute name by prefix list
            const prefix = this.prefixList.find((p) => attr.name.startsWith(p));

            // get attribute name without prefix
            const eventName = attr.name.replace(prefix, '');

            return new EventRenderScope(expression, target, eventName);
        });
        // remove all related attributes from target
        attributeNodes.forEach((attr) => target.removeAttribute(attr.name));

        if (renderScopes.length > 0) {
            return renderScopes;
        }

        return false;
    }
}
