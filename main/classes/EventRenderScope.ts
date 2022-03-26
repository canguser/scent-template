import { RenderScope } from '../interface/RenderScope';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { register, unregister } from '@rapidly/utils/lib/commom/dom/DomEvent';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';

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

    render(context: ()=>object): void {
        const func = execExpression(
            `
            (function($e){
                const result = (${this.expression});
                if (typeof result === 'function'){
                    return result.call(this, $e)
                }
            })
        `,
            context()
        );

        if (this.eventHandlerId) {
            unregister(this.eventHandlerId);
        }

        this.eventHandlerId = register(this.target, this.eventName, (e) => {
            func.call(context(), e);
        });
    }
}

export class EventRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Inherited;

    constructor(public prefixList: string[] = ['s-on', '@']) {}

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        const [prefix, alias] = this.prefixList;
        const attrInfos = getAttributeInfoMapping(target, [prefix], { [prefix]: alias })[prefix] || [];

        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.map((attr) => {
            const scope = new EventRenderScope(attr.value, target, attr.name);
            // remove all related attributes from target
            target.removeAttribute(attr.fullName);
            return scope;
        });
    }
}
