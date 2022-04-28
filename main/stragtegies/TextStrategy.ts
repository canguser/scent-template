import { BasicStrategy } from './BasicStrategy';
import { Context } from '../context/Context';

export class TextStrategy extends BasicStrategy {
    match<C extends Context>(element: Element, context: C): boolean {
        if (element.nodeType === Node.TEXT_NODE && element.parentNode.nodeType !== Node.COMMENT_NODE) {
            const text = element.textContent;
            if (text.trim()) {
                context.scope.bindText(element, { expression: text });
                return true;
            }
        }
        return false;
    }
}
