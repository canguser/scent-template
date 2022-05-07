import { Context, ContextOptions } from './Context';

export interface ProxyContextOptions<T extends object = object> extends ContextOptions {
    proxyHandler: ProxyHandler<T>;
}

export class ProxyContext<T extends object = object> extends Context<T, object, ProxyContextOptions> {
    options: ProxyContextOptions<T>;

    get proxyHandler(): ProxyHandler<T> {
        return this.options.proxyHandler;
    }

    protected buildContext(context: T): T {
        return new Proxy(context, this.proxyHandler);
    }
}
