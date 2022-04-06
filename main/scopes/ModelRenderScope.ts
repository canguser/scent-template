import { RenderScope } from '../interface/RenderScope';
import { RenderScopeStrategy } from '../interface/RenderScopeStrategy';
import { ScopeType } from '../enum/ScopeType';
import { getAttributeInfoMapping } from '../utils/DomHelper';
import { BindRenderScope } from '../classes/BindRenderScope';
import { EventRenderScope } from '../classes/EventRenderScope';

export class ModelRenderScopeStrategy implements RenderScopeStrategy<Element> {
    type: ScopeType = ScopeType.Inherited;
    prefixList: string[] = ['s-model'];

    identityName = 'model';

    match(target: Element): RenderScope<Element>[] | false {
        const [prefix, alias] = this.prefixList;
        const attrInfos = getAttributeInfoMapping(target, [prefix], { [prefix]: alias })[prefix] || [];
        if (attrInfos.length === 0) {
            return false;
        }
        // generate render scopes from attribute nodes
        return attrInfos.reduce((scopes, attr) => {
            const { value, name, more } = attr;
            scopes.push(new BindRenderScope(value, target, name || 'value'));
            scopes.push(new EventRenderScope(`e=>((${value})=e.detail?e.detail.value:(e.target?e.target.value:null))`, target, more || 'input'));
            // remove all related attributes from target
            target.removeAttribute(attr.fullName);
            return scopes;
        }, []);
    }
}
