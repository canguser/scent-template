import { ExpressionRaw } from '../interface/normal.interface';

export function execExpression(expression = '', context = {}) {
    // console.log('parse expression', expression);
    if (!expression || !expression.trim()) {
        return undefined;
    }
    try {
        return new Function('context', `with(context){return (${expression})}`)(context);
    } catch (e) {
        console.warn('there\'s some un-except expression: ' + expression, e);
        return undefined;
    }
}

export function getBindingExpressions(text = '', prefix = '{{', suffix = '}}'): ExpressionRaw {
    const matchResults = [...text.matchAll(/{{(.+?)}}/g)];
    return {
        raw: text.split(/{{.+?}}/),
        expressions: matchResults.map(([, expression]) => expression)
    };
}