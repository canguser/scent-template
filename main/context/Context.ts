import { merge } from '../utils/NormalUtils';
import { configuration } from '../configure';
import { BasicScope } from '../scopes/BasicScope';
import { TextScope } from '../scopes/TextScope';
import { IfScope } from '../scopes/IfScope';
import { ScentObject } from '../utils/ScentObject';
import { ScopeManager } from '../scopes/ScopeManager';

export interface ContextOptions {
    configuration?: typeof configuration;
}

const defaultOptions: ContextOptions = {
    configuration
};

type Scopes = {
    bindText: TextScope;
    bindIf: IfScope;
};

type ScopeBuilder<E> = { [key in keyof Scopes]: (ele: E, options?: any) => Scopes[key] | undefined };

export abstract class Context<
    T extends object = object,
    E = Element,
    Options extends ContextOptions = ContextOptions
> extends ScentObject {
    protected context: T;
    protected options: Options;

    public get scope(): ScopeBuilder<E> {
        return new Proxy<ScopeBuilder<E>>({} as ScopeBuilder<E>, {
            get: (target: {}, p: string | symbol): any => {
                console.log(this);
                const scopes = this.configuration.get('scopes', {});
                if (typeof p === 'string') {
                    // get scope name by splice string after 'bind' and convert to lowercase initial
                    const parts = p.split('bind');
                    const scopeName = parts[1] ? parts[1].charAt(0).toLowerCase() + parts[1].slice(1) : '';
                    if (scopeName in scopes) {
                        return (ele, ...args) => {
                            const scope = new scopes[scopeName](ele, this, ...args);
                            this.scopeManager.renderScope(scope);
                            return scope.id;
                        };
                    }
                }
                return () => console.warn('no such scope bound:', p);
            },
            set: () => true
        });
    }

    get scopeManager(): ScopeManager {
        return this.configuration.get<ScopeManager>('instances.scopeManager');
    }

    protected constructor(context?: T, options?: Options) {
        super();
        this.options = merge({} as Options, defaultOptions, options);
        this.context = this.buildContext(context || ({} as T));
    }

    protected get configuration(): typeof configuration {
        return this.options.configuration;
    }

    public get contextGetter(): () => T {
        return () => this.context || ({} as T);
    }

    protected abstract buildContext(context: T): T;
}
