import { ComponentFn } from '../../template/component';
import { configuration } from '../../core/configure';
import { ScopeManager } from '../../core/scopes/managers/ScopeManager';
import { parseQueryString } from '@rapidly/utils/lib/commom/url/parseQueryString';
import { urlJoin } from '@rapidly/utils/lib/commom/url/urlJoin';
import { matchTemplate } from '@rapidly/utils/lib/commom/string/matchTemplate';
import { template } from '@rapidly/utils/lib/commom/string/template';
import { register } from '@rapidly/utils/lib/commom/dom/DomEvent';

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
    rule?: RouterRule;
    element?: Element;
}

export class Router {
    histories: Route[] = [];
    target: Element;

    constructor(protected readonly options: BasicRouterOptions) {
        this.target = document.createElement('router');
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

    public push(name: string, params?: { [key: string]: string }, query?: { [key: string]: string });

    public push(path: string): void {
        if (this.mode === 'hash') {

        }
    }

    public back(): void {}

    protected applyRoute(): void {
        if (this.mode === 'hash') {
            const latestRoute = this.latestRoute || {};
            const path = location.hash.slice(1) || '';
            const currentRoute = this.genRoute(path);
            if (path !== currentRoute.path) {
                location.hash = currentRoute.path;
            }
            let toChangeRoute = latestRoute;
            if (currentRoute.path !== latestRoute.path) {
                toChangeRoute = currentRoute;
                const { rule, props } = currentRoute;
                if (latestRoute.rule !== rule) {
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
                } else {
                    currentRoute.props = latestRoute.props;
                    currentRoute.element = latestRoute.element;
                }
                this.histories.push(currentRoute);
            }
            const { rule, props, params, query } = toChangeRoute;
            if (rule.props) {
                const newProps =
                    typeof rule.props === 'function'
                        ? rule.props(params, query)
                        : rule.props === true
                        ? { ...query, ...params }
                        : rule.props;
                Object.keys(newProps).forEach((key) => {
                    props[key] = newProps[key];
                });
            }
        }
    }

    protected genRoute(path: string): Route {
        let [p = '', query = ''] = path.split('?');
        const queryParams = parseQueryString(query);
        p = urlJoin(p);
        const { rules } = this;
        let isMatch = false,
            matchedRoute: Route = {
                path: p,
                query: queryParams
            };
        for (const rule of rules) {
            const rulePath = urlJoin(rule.path);
            p = urlJoin(p);
            const matchResult = matchTemplate<{ [key: string]: string }>(p, rulePath);
            if (matchResult) {
                location.hash = p + (query ? '?' + query : '');
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
