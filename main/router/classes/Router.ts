import { ComponentFn } from '../../template/component';
import { configuration } from '../../core/configure';
import { ScopeManager } from '../../core/scopes/managers/ScopeManager';
import { parseQueryString } from '@rapidly/utils/lib/commom/url/parseQueryString';
import { urlJoin } from '@rapidly/utils/lib/commom/url/urlJoin';
import { template } from '@rapidly/utils/lib/commom/string/template';
import { register } from '@rapidly/utils/lib/commom/dom/DomEvent';
import { merge } from '@rapidly/utils/lib/commom/object/merge';
import { matchUrlTemplate } from '@rapidly/utils/lib/commom/url/matchUrlTemplate';
import { formatUrl } from '@rapidly/utils/lib/commom/url/formatUrl';
import { pathJoin } from '@rapidly/utils/lib/commom/path/pathJoin';
import { findNode } from '../../utils/DomHelper';

export interface RouterRule {
    name?: string;
    path: string;
    component: ComponentFn;
    props?: object | boolean | ((params?: { [key: string]: string }, query?: { [key: string]: string }) => object);
    default?: boolean;
    keepAlive?: boolean;
    subRules?: RouterRule[];
}

export interface BasicRouterOptions {
    rules?: RouterRule[];
    mode?: 'hash' | 'history';
}

export interface Route {
    path?: string;
    matchPath?: string;
    query?: { [key: string]: string };
    params?: { [key: string]: string };
    props?: object;
}

export interface ElementRoute extends Route {
    rule?: RouterRule;
    element?: Element;
    querystring?: string;
    subRoute?: ElementRoute;
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
        preventHashChangeHandling = true;
        this.applyRoute();
        preventHashChangeHandling = false;
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

    private syncRouteProps(route: ElementRoute) {
        const { rule, query, params } = route;
        if (rule.props) {
            const newProps =
                typeof rule.props === 'function'
                    ? rule.props(params, query)
                    : rule.props === true
                    ? { ...query, ...params }
                    : rule.props;
            Object.keys(newProps).forEach((key) => {
                route.props[key] = newProps[key];
            });
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

            let routeChanged = false;
            // check the same level route if is changed
            for (
                let current = currentRoute, latest = latestRoute, parentRoute;
                current;
                parentRoute = current, current = current.subRoute, latest = latest?.subRoute
            ) {
                // check if route is changed by its rule
                const isChanged = routeChanged || latest?.rule !== current.rule;

                if (isChanged) {
                    routeChanged = true;
                    const { rule } = current;
                    const componentFn = rule.component;
                    if (typeof componentFn === 'function') {
                        const props = (current.props = this.adaptor.create({}));
                        const newEle = (current.element = componentFn(props, {}));
                        const lastEle = latest?.element;
                        if (lastEle && lastEle.parentNode) {
                            lastEle.parentNode.replaceChild(newEle, lastEle);
                            // todo - destroy lastEle
                        } else if (parentRoute && parentRoute.element) {
                            const placeholderText = '- router -';
                            const placeholder = findNode(parentRoute.element, (node) => {
                                return node.nodeType === 3 && node.textContent === placeholderText;
                            });
                            if (placeholder && placeholder.parentNode) {
                                placeholder.parentNode.replaceChild(newEle, placeholder);
                            }else {
                                // todo - disable current route
                            }
                        } else {
                            this.target.appendChild(newEle);
                        }
                    }
                    this.syncRouteProps(current);
                }
            }
            let refreshedRoute = latestRoute;
            if (routeChanged) {
                refreshedRoute = currentRoute;
                this.histories.push(currentRoute);
            } else {
                for (
                    let current = currentRoute, latest = latestRoute;
                    current;
                    current = current.subRoute, latest = latest.subRoute
                ) {
                    // sync latest route from current
                    latest.path = current.path;
                    latest.querystring = current.querystring;
                    latest.query = current.query;
                    latest.params = current.params;
                    this.syncRouteProps(latest);
                }
            }
            this.assignRoute(refreshedRoute);
        }
    }

    protected genRoute(path: string, rules?: RouterRule[], pathPrefix?: string): ElementRoute {
        rules = rules || this.rules || [];
        let [p = '', query = ''] = path.split('?');
        const queryParams = parseQueryString(query);
        p = formatUrl(p);
        let isMatch = false,
            isPartial = false,
            matchedRoute: ElementRoute = {
                path: p,
                query: queryParams,
                querystring: query
            };
        for (const rule of rules) {
            const rulePath = formatUrl((pathPrefix ? pathPrefix + '/' : '') + rule.path);
            const matchResult = matchUrlTemplate<{ [key: string]: string }>(p, rulePath);
            if (matchResult) {
                isPartial = matchResult.partial;
                if (isPartial) {
                    matchedRoute.matchPath = matchResult.match;
                }
                isMatch = true;
                matchedRoute.params = matchResult.params;
                matchedRoute.rule = rule;
                break;
            }
        }
        if (!isMatch) {
            const defaultRule = rules.find((rule) => rule.default) || rules[0];
            if (defaultRule) {
                matchedRoute.params = {};
                matchedRoute.rule = defaultRule;
                matchedRoute.path =
                    template(formatUrl((pathPrefix ? pathPrefix + '/' : '') + defaultRule.path), {}) +
                    (query ? '?' + query : '');
            }
        }
        if (isPartial) {
            const subRules = matchedRoute.rule.subRules || [];
            if (subRules.length > 0) {
                matchedRoute.subRoute = this.genRoute(path, subRules, matchedRoute.matchPath);
            }
        }
        return matchedRoute;
    }
}
