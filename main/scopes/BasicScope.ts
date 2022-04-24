import { configuration } from '../configure';
import { merge } from '../utils/NormalUtils';
import { Context } from '../context/Context';
import { ScopeManager } from './ScopeManager';
import { ScentObject } from '../utils/ScentObject';

export interface BasicScopeOptions {
    configuration?: typeof configuration;
    subScopes?: (<T, C>(target: T, context: C) => string[]) | string[];
}

const defaultOptions: BasicScopeOptions = {
    configuration
};

export abstract class BasicScope<
    E = Element,
    Option extends BasicScopeOptions = BasicScopeOptions,
    C extends Context<object, E> = Context<object, E>
> extends ScentObject {
    public readonly id: string;
    protected readonly aggregated: boolean = false;
    protected target: E;
    protected options: Option;
    protected context: C;
    private subScopes: { [key: string]: string[] } = {};
    private existedSubScopeInfos: { [key: string]: { target: E; extra?: any } } = {};
    private subScopeInfos: { [key: string]: { target: E; extra?: any } };

    protected constructor(target: E, context: C, options?: Option) {
        super();
        this.target = target;
        this.context = context;
        this.options = merge({} as Option, defaultOptions, options);
        const { configuration } = this.options;
        // gen self id
        const idGenerator = configuration.get<Function>('idGenerator');
        this.id = idGenerator();
        this.scopeManager.registerScope(this);
    }

    protected get configuration() {
        return this.options.configuration;
    }

    protected get scopeManager() {
        return this.configuration.get<ScopeManager>('instances.scopeManager');
    }

    protected putScopeInfo(key: string, target: E, extra?: any) {
        if (!this.subScopeInfos){
            this.subScopeInfos = {};
        }
        this.subScopeInfos[key] = { target, extra };
    }

    protected putScopeInfos(infos: { [key: string]: { target: E; extra?: any } }) {
        this.subScopeInfos = Object.assign(this.subScopeInfos || {}, infos);
    }

    protected buildToRenderScopeInfos() {
        const existKeys = Object.keys(this.existedSubScopeInfos || {});
        const subScopeInfos = this.subScopeInfos || {};
        const allKeys = Object.keys(subScopeInfos);
        const newScopeInfos = allKeys.reduce((result, key) => {
            if (!existKeys.includes(key)) {
                result[key] = subScopeInfos[key];
            }
            return result;
        }, {} as { [key: string]: { target: E; extra?: any } });
        const toDeleteKeys = existKeys.filter((key) => !allKeys.includes(key));
        toDeleteKeys.forEach((key) => {
            delete this.existedSubScopeInfos[key];
            const existedScopes = this.subScopes[key] || [];
            existedScopes.forEach((scope) => {
                this.scopeManager.unregisterScope(scope);
            });
        });
        Object.assign(this.existedSubScopeInfos, newScopeInfos);
        this.subScopeInfos = undefined;
        return newScopeInfos;
    }

    protected getContextObject(): object {
        return this.context.contextGetter();
    }

    public renderAll() {
        this.render();
        this.renderSubScopes();
    }

    public abstract render(): void;

    protected getSubContext(key: string, extra: any): C {
        return this.context;
    }

    protected get canRenderSubScopes() {
        const subScopes = this.options.subScopes;
        return typeof subScopes === 'function' || (Array.isArray(subScopes) && subScopes.length > 0);
    }

    private getSubToRenderScopes(): string[] {
        const subScopes = this.options.subScopes;
        if (typeof subScopes === 'function') {
            const scopes = [];

            const newScopeInfos = this.buildToRenderScopeInfos();
            Object.keys(newScopeInfos).forEach((key) => {
                const scopeInfo = newScopeInfos[key];
                const { target, extra } = scopeInfo;
                const newSubScopes = subScopes(target, this.getSubContext(key, extra));
                if (newSubScopes) {
                    scopes.push(...newSubScopes);
                    this.subScopes[key] = newSubScopes;
                }
            });

            return scopes;
        }
        return subScopes || [];
    }

    public renderSubScopes(): void {
        if (this.aggregated && this.canRenderSubScopes) {
            const subScopes = this.options.subScopes;
            if (subScopes) {
                const subScopeIds = this.getSubToRenderScopes();
                subScopeIds.forEach((subScopeId) => {
                    this.scopeManager.renderById(subScopeId);
                });
            }
        }
    }
}
