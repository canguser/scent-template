import { RenderScope } from '../interface/RenderScope';
import { template } from '@rapidly/utils/lib/commom/string/template';

export class TextRenderScope implements RenderScope {

    target: any;
    expression: any;

    constructor(target: any, expression: any) {
        this.target = target;
        this.expression = expression;
    }

    render(context: object) {
        this.target.textContent = template(this.expression, context);
    }


}