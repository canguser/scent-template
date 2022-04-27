import { configuration } from '../configure';
import { merge } from '../utils/NormalUtils';
import { Context } from '../context/Context';
import { ScopeManager } from './ScopeManager';
import { ScentObject } from '../utils/ScentObject';
import { groupBy } from '@rapidly/utils/lib/array/groupBy';

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
    protected existedSubScopeInfos: Array<{ key: string; target: E; extra?: any }> = [];
    private subScopeInfos: Array<{ key: string; target: E; extra?: any }> = [];

    public constructor(target: E, context: C, options?: Option) {
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
        this.subScopeInfos.push({ key, target, extra });
    }

    protected putScopeInfos(infos: { key: string; target: E; extra?: any }[]) {
        this.subScopeInfos.push(...infos);
    }

    protected buildToRenderScopeInfos() {
        let subScopeInfos = this.subScopeInfos || [];
        // check if key is duplicated
        const hasDuplicated = subScopeInfos.some((info, index) =>
            subScopeInfos.some((info2, index2) => index !== index2 && info.key === info2.key)
        );
        if (hasDuplicated) {
            subScopeInfos = subScopeInfos.map((info, i) => {
                info.key = i + '';
                return info;
            });
            console.warn(
                `[${this.constructor.name}] has duplicated subScope key, so we use index as key, please check your code.`
            );
        }
        // build new scope infos
        const newScopeInfos = [];
        const toRenderSubScopeInfos = [];
        const allNewKeys = [];
        const existedScopeInfosGroupedByKey = groupBy(this.existedSubScopeInfos, 'key');
        for (const info of subScopeInfos) {
            allNewKeys.push(info.key);
            if (existedScopeInfosGroupedByKey.has(info.key)) {
                const existedScopeInfo = [...existedScopeInfosGroupedByKey.get(info.key)][0];
                if (existedScopeInfo) {
                    newScopeInfos.push(existedScopeInfo);
                    continue;
                }
            }
            toRenderSubScopeInfos.push(info);
            newScopeInfos.push(info);
        }
        // get all keys not existed in new scope infos
        const toRemoveKeys = subScopeInfos.map((i) => i.key).filter((key) => !allNewKeys.includes(key));

        toRemoveKeys.forEach((key) => {
            delete this.existedSubScopeInfos[key];
            const existedScopes = this.subScopes[key] || [];
            existedScopes.forEach((scope) => {
                this.scopeManager.unregisterScope(scope);
            });
        });
        this.existedSubScopeInfos = newScopeInfos;
        this.subScopeInfos = [];
        console.log(toRenderSubScopeInfos);
        return toRenderSubScopeInfos;
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
            newScopeInfos.forEach((scopeInfo) => {
                const { target, extra, key } = scopeInfo;
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
