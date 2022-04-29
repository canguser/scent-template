import { BasicScope, BasicScopeOptions } from './BasicScope';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';
import { toDashName } from '../utils/NormalUtils';
import { register, unregister } from '@rapidly/utils/lib/commom/dom/DomEvent';

export interface EventScopeOptions extends BasicScopeOptions {
    eventName: string;
    expression: string;
    subScopes?: never;
}

export class EventScope extends BasicScope<Element, EventScopeOptions> {
    originValue: string;
    eventHandlerId: string;

    render(): void {
        const { eventName, expression } = this.options;
        const func = execExpression(
            `
            (function($e){
                const result = (${expression});
                if (typeof result === 'function'){
                    return result.call(this, $e)
                }
            })
        `,
            this.getContextObject()
        );

        if (this.eventHandlerId) {
            unregister(this.eventHandlerId);
        }

        this.eventHandlerId = register(this.target, eventName, (e) => {
            func.call(this.getContextObject(), e);
        });
    }
}
