import { ComponentFn } from '../../template/component';
import { configuration } from '../../core/configure';
import { ScopeManager } from '../../core/scopes/managers/ScopeManager';
import { parseQueryString } from '@rapidly/utils/lib/commom/url/parseQueryString';
import { urlJoin } from '@rapidly/utils/lib/commom/url/urlJoin';
import { template } from '@rapidly/utils/lib/commom/string/template';
import { register } from '@rapidly/utils/lib/commom/dom/DomEvent';
import { merge } from '@rapidly/utils/lib/commom/object/merge';
import { matchUrlTemplate } from '@rapidly/utils/lib/commom/url/matchUrlTemplate';

export interface RouterRule {
    name?: string;
    path: string;
    component: ComponentFn;
    props?: object | boolean | ((params?: { [key: string]: string }, query?: { [key: string]: string }) => object);
    default?: boolean;
    keepAlive?: boolean;
}

export interface BasicRouterOptions {
    rules?: RouterRule[];
    mode?: 'hash' | 'history';
}

export interface Route {
    path?: string;
    query?: { [key: string]: string };
    params?: { [key: string]: string };
    props?: object;
}

export interface ElementRoute extends Route {
    rule?: RouterRule;
    element?: Element;
    querystring?: string;
}

export class Router {
    histories: ElementRoute[] = [];
    target: Element;
    route: Route;
    hasApplied: boolean = false;

    constructor(protected readonly options: BasicRouterOptions) {
        this.target = document.createElement('router');
    }

    public apply() {
        if (this.hasApplied) return;
        this.assignRoute();
        let preventHashChangeHandling = false;
        register(window, 'hashchange', () => {
            if (!preventHashChangeHandling) {
                preventHashChangeHandling = true;
                this.applyRoute();
                preventHashChangeHandling = false;
            }
        });
        this.applyRoute();
    }

    get mode() {
        return this.options.mode || 'hash';
    }

    get rules() {
        return this.options.rules || [];
    }

    get latestRoute() {
        return this.histories[this.histories.length - 1];
    }

    private get adaptor() {
        const scopeManager = configuration.get<ScopeManager>('instances.scopeManager');
        return scopeManager.proxyAdaptor;
    }

    public push(name: string, params?: { [key: string]: any }, query?: { [key: string]: any });

    public push(path: string);

    public push(pathOrName: string, params?: { [key: string]: any }, query?: { [key: string]: any }): void {
        let path: string = pathOrName;
        const rule = this.options.rules.find((rule) => rule.name === pathOrName);
        if (rule) {
            path =
                template(rule.path, params) +
                (query
                    ? `?${Object.keys(query)
                          .map((key) => `${key}=${query[key]}`)
                          .join('&')}`
                    : '');
        }
        if (this.mode === 'hash') {
            const { latestRoute } = this;
            const currentPath = latestRoute.path;
            window.location.hash = urlJoin(currentPath, path);
        }
    }

    public back(): void {}

    private assignRoute(route?: Route) {
        if (!this.route) {
            this.route = this.adaptor.create({
                query: this.adaptor.create({}),
                params: this.adaptor.create({}),
                props: this.adaptor.create({})
            });
        }
        if (route) {
            merge(this.route, route);
        }
    }

    protected applyRoute(): void {
        if (this.mode === 'hash') {
            const latestRoute = this.latestRoute || {};
            const path = location.hash.slice(1) || '';
            const currentRoute = this.genRoute(path);
            if (path !== currentRoute.path) {
                location.hash =
                    currentRoute.path + (currentRoute.querystring?.length ? '?' + currentRoute.querystring : '');
            }
            // check if route is changed by its rule
            const isChanged = latestRoute.rule !== currentRoute.rule;
            let refreshedRoute = latestRoute;

            if (isChanged) {
                refreshedRoute = currentRoute;
                const { rule, props } = currentRoute;
                const componentFn = rule.component;
                if (typeof componentFn === 'function') {
                    const newEle = (currentRoute.element = componentFn(props, {}));
                    const lastEle = latestRoute.element;
                    if (lastEle) {
                        this.target.replaceChild(newEle, lastEle);
                        // todo - destroy lastEle
                    } else {
                        this.target.appendChild(newEle);
                    }
                }
                this.histories.push(currentRoute);
            } else {
                // update latest route
                latestRoute.path = currentRoute.path;
                latestRoute.querystring = currentRoute.querystring;
                latestRoute.query = currentRoute.query;
                latestRoute.params = currentRoute.params;
            }
            const { rule, query, params } = refreshedRoute;
            if (rule.props) {
                const newProps =
                    typeof rule.props === 'function'
                        ? rule.props(params, query)
                        : rule.props === true
                        ? { ...query, ...params }
                        : rule.props;
                Object.keys(newProps).forEach((key) => {
                    refreshedRoute.props[key] = newProps[key];
                });
            }
            this.assignRoute(refreshedRoute);
        }
    }

    protected genRoute(path: string): ElementRoute {
        let [p = '', query = ''] = path.split('?');
        const queryParams = parseQueryString(query);
        p = urlJoin(p);
        const { rules } = this;
        let isMatch = false,
            matchedRoute: ElementRoute = {
                path: p,
                query: queryParams,
                querystring: query
            };
        for (const rule of rules) {
            const rulePath = urlJoin(rule.path);
            p = urlJoin(p);
            const matchResult = matchUrlTemplate<{ [key: string]: string }>(p, rulePath);
            if (matchResult) {
                isMatch = true;
                matchedRoute.params = matchResult;
                matchedRoute.rule = rule;
                break;
            }
        }
        if (!isMatch) {
            const defaultRule = rules.find((rule) => rule.default) || rules[0];
            if (defaultRule) {
                matchedRoute.params = {};
                matchedRoute.rule = defaultRule;
                matchedRoute.path = template(urlJoin(defaultRule.path), {}) + (query ? '?' + query : '');
            }
        }
        matchedRoute.props = this.adaptor.create({});
        return matchedRoute;
    }
}
