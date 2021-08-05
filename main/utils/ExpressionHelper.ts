import { ExpressionRaw } from '../interface/normal.interface';

export function execExpression(expression = '', context = {}) {
    return new Function('context', `with(context){return (${expression})}`)(context);
}

export function getBindingExpressions(text = '', prefix = '{{', suffix = '}}'): ExpressionRaw {
    const matchResults = [...text.matchAll(/{{(.+?)}}/g)];
    return {
        raw: text.split(/{{.+?}}/),
        expressions: matchResults.map(([, expression]) => expression)
    };
}