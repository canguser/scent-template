import { Directive, DirectiveHookParams } from '../interface/normal.interface';
import { execExpression } from '../utils/ExpressionHelper';

export const cIF: Directive = {
    name: 'if',
    isScoped: true,
    defineTemplates(template, details) {
        const params = details.getDynamicResult();
        if (!params.result) {
            return {};
        }
        return {
            ...template.from('if')
        };
    }
};

export const cFOR: Directive = {
    name: 'for',
    isScoped: true,
    defineTemplates(template, details) {
        const params = details.getDynamicResult();
        return (params.result || []).reduce(
            (r, item, i, list) => {
                Object.assign(r, template.from(i, {
                    get [params.attributeValue]() {
                        return list[i];
                    }
                }));
                return r;
            }, {}
        );
    }
};

export const cBIND: Directive = {
    name: 'bind',
    render({ target, details }: DirectiveHookParams) {
        const { attributeValue, result } = details.getDynamicResult() || {};
        if (attributeValue) {
            target.setAttribute(attributeValue, result);
        }
    }
};
export const cCLICK: Directive = {
    name: 'on',
    created(context, { target, details, trans }: DirectiveHookParams) {
        const listener = execExpression(
            `
                (function($e){
                    const result = (${details.expression});
                    if (typeof result === 'function'){
                        return result.call(this, $e)
                    }
                })
            `,
            context
        ).bind(context);
        target.addEventListener(details.attribute, listener);
        trans.listener = listener;
        trans.event = details.attribute;
    },
    destroyed({ target, details, trans }: DirectiveHookParams): void {
        console.log('destroyed', trans);
        const { listener, event } = trans;
        target.removeEventListener(event, listener);
    }
};
