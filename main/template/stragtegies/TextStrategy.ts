import { BasicStrategy } from './BasicStrategy';
import { Context } from '../../core/context/Context';

export class TextStrategy extends BasicStrategy {
    match<C extends Context>(element: Element, context: C): string[] | false {
        if (element.nodeType === Node.TEXT_NODE && element.parentNode.nodeType !== Node.COMMENT_NODE) {
            const text = element.textContent;
            if (text.trim()) {
                return [context.scope.bindText(element, { expression: text })];
            }
        }
        return false;
    }
}
