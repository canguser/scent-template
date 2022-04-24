import { Context } from './Context';

export class AdaptedContext extends Context {

    protected buildContext(context: object): object {
        return context;
    }

    get adaptor(): string {
        return this.configuration.get('proxyAdaptor');
    }

}