import { RenderScope } from '../interface/RenderScope';
import { RenderResult } from '../interface/RenderResult';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { getAttributeNodes } from '../utils/DomHelper';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';

export class IteratedRenderScope implements RenderScope {
    expression: string;
    target: any;
    identityKey: string;
    iteratorItem: string;
    indexKey: string = '$index';
    template: any;

    constructor(expression: string, target: any, identityKey: string, iteratorItem: string, template: any) {
        this.expression = expression;
        this.target = target;
        this.identityKey = identityKey;
        this.iteratorItem = iteratorItem;
        this.template = template;
    }

    render(context: () => object): RenderResult {
        const result = execExpression(this.expression, context());
        const array = Array.isArray(result) ? result : Array.from(result);
        return {
            replaceParent: true,
            rendererParams: array
                .filter((item) => item != null)
                .map((item, index) => {
                    const i = index;
                    const ctx = new Proxy(context(), {
                        get: (target, key) => {
                            if (key === this.indexKey) {
                                return i;
                            }

                            if (key === this.iteratorItem) {
                                return array[i];
                            }
                            return context()[key];
                        },
                        set: (target: object, p: string | symbol, value: any, receiver: any): boolean => {
                            if (p === this.indexKey) {
                                return false;
                            }
                            context()[p] = value;
                            return true;
                        }
                    });
                    const identityValue = execExpression(this.identityKey, ctx);
                    return {
                        identity: identityValue || index,
                        context: ctx,
                        template: this.template
                    };
                })
        };
    }
}

export class IteratedRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Alienated_UNIQUE;

    constructor(public prefixList: string[] = ['s-for']) {}

    match(target: Element): RenderScope<Element> | RenderScope<Element>[] | false {
        // get all attributes nodes match prefix
        const attributeNode = getAttributeNodes(target, this.prefixList)[0];
        if (!attributeNode) {
            return false;
        }
        const keyAttribute = target.getAttribute('s-key');
        const [, item] = attributeNode.name.split(':');
        const targetKey = attributeNode.value;
        target.removeAttribute(attributeNode.name);
        target.removeAttribute('s-key');
        const template = target.cloneNode(true);
        return new IteratedRenderScope(targetKey, target, keyAttribute || '$index', item, template);
    }
}
