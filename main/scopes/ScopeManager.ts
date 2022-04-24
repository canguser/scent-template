import { BasicScope } from './BasicScope';
import { ScentObject } from '../utils/ScentObject';

export class ScopeManager extends ScentObject{
    scopesMapper: { [key: string]: BasicScope } = {};

    public registerScope<T extends BasicScope<any>>(scope: T) {
        this.scopesMapper[scope.id] = scope;
    }

    public unregisterScope(scopeId: string) {
        delete this.scopesMapper[scopeId];
    }

    public renderById(id: string | string[]) {
        return this.renderScope(Array.isArray(id) ? id.map((i) => this.scopesMapper[i]) : this.scopesMapper[id]);
    }

    public renderScope<T extends BasicScope<any>>(scope: T | T[]) {
        if (Array.isArray(scope)) {
            scopeId.forEach((scope) => this.renderScope(scope));
            return;
        }
        if (!scope) {
            return;
        }
        scope.render();
        scope.renderSubScopes();
        return;
    }
}
