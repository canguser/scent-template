import { RenderScope } from '../interface/RenderScope';
import { ergodicTree, genUniqueId } from '../utils/NormalUtils';
import { TextRenderScope } from './TextRenderScope';
import { replaceDom } from '../utils/DomHelper';

export class ScentRenderer{

    protected virtualDom;
    protected renderScopes: RenderScope[] = [];

    constructor(protected mountDom, protected template: string, protected context: object) {
        this.init();
    }

    init(){
        this.compile()
        this.render();
    }

    render() {
        this.renderScopes.forEach(scope => {
            scope.render(this.context);
        })
    }

    mount(mountDom){
        mountDom = mountDom || this.mountDom;
        replaceDom(mountDom, this.virtualDom);
    }

    compile(): void {
        // compile template to dom
        const tempDom = document.createElement('template');
        tempDom.innerHTML = this.template;
        this.virtualDom = (tempDom.cloneNode(true) as HTMLTemplateElement).content;
        ergodicTree(this.virtualDom)((node) => {
            let scope;
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                scope = new TextRenderScope(node, text);
            }
            if (scope){
                scope.id = genUniqueId();
                this.renderScopes.push(scope);
            }
        });
    }

}