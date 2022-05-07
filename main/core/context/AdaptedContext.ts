import { Context } from './Context';
import { ScopeManager } from '../scopes/managers/ScopeManager';
import { ProxyAdaptor } from '../adaptor/ProxyAdaptor';

export class AdaptedContext extends Context {
    protected buildContext(context: object): object {
        return this.adaptor.create(context);
    }

    get adaptor(): ProxyAdaptor {
        return this.configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
    }
}
