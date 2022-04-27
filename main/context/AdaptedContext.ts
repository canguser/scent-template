import { Context } from './Context';
import { ScopeManager } from '../scopes/ScopeManager';
import { ProxyAdaptor } from './ProxyAdaptor';

export class AdaptedContext extends Context {
    protected buildContext(context: object): object {
        return this.adaptor.create(context);
    }

    get adaptor(): ProxyAdaptor {
        return this.configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
    }
}
