import { ComponentFn, ComponentFnOptions } from '../component';
import { register } from '@rapidly/utils/lib/commom/dom/DomEvent';
import { urlJoin } from '@rapidly/utils/lib/commom/url/urlJoin';
import { matchTemplate } from '@rapidly/utils/lib/commom/string/matchTemplate';
import { configuration } from '../configure';
import { ScopeManager } from '../scopes/ScopeManager';
import { parseQueryString } from '@rapidly/utils/lib/commom/url/parseQueryString';
import { template } from '@rapidly/utils/lib/commom/string/template';

export interface RouterRule {
    name?: string;
    path: string;
    component: ComponentFn;
    props?: object | boolean | ((params?: { [key: string]: string }, query?: { [key: string]: string }) => object);
    default?: boolean;
}

export interface BasicRouterOptions {
    rules?: RouterRule[];
}

export function defineRouter({ rules = [] }: BasicRouterOptions = {}): ComponentFn {
    return (props: any, options: ComponentFnOptions = {}) => {
        const scopeManager = configuration.get<ScopeManager>('instances.scopeManager');
        const adaptor = scopeManager.proxyAdaptor;

        const target = document.createElement(options.alias || 'router');
        let currentEle: Element;
        let lastRule: RouterRule;
        let lastProps: any = adaptor.create({});

        function assignProps(props: any) {
            if (!lastProps) {
                lastProps = adaptor.create({});
            }
            Object.keys(props).forEach((key) => {
                lastProps[key] = props[key];
            });
        }

        function changeRule(rule: RouterRule) {
            const componentFn = rule.component;
            if (typeof componentFn === 'function') {
                const newEle = componentFn(lastProps, {});
                const lastEle = currentEle;
                if (lastEle) {
                    target.replaceChild(newEle, lastEle);
                    currentEle = newEle;
                    // todo - destroy lastEle
                } else {
                    target.appendChild(newEle);
                    currentEle = newEle;
                }
            }
        }

        function applyRule(rule, params, query) {
            if (lastRule !== rule) {
                lastProps = adaptor.create({});
                changeRule(rule);
                lastRule = rule;
            }
            if (rule.props) {
                const props =
                    typeof rule.props === 'function'
                        ? rule.props(params, query)
                        : rule.props === true
                        ? { ...query, ...params }
                        : rule.props;
                assignProps(props || {});
            }
        }

        function matchRules() {
            const hash = window.location.hash.slice(1) || '';
            let [path = '', query = ''] = hash.split('?');
            const queryParams = parseQueryString(query);
            let isMatch = false;
            for (const rule of rules) {
                const rulePath = urlJoin(rule.path);
                path = urlJoin(path);
                const matchResult = matchTemplate<{ [key: string]: string }>(path, rulePath);
                if (matchResult) {
                    location.hash = path + (query ? '?' + query : '');
                    applyRule(rule, matchResult, queryParams);
                    isMatch = true;
                    break;
                }
            }
            if (!isMatch) {
                const defaultRule = rules.find((rule) => rule.default) || rules[0];
                if (defaultRule) {
                    applyRule(defaultRule, {}, queryParams);
                    location.hash = template(urlJoin(defaultRule.path), {}) + (query ? '?' + query : '');
                }
            }
        }

        let preventHashChangeHandling = false;

        register(window, 'hashchange', () => {
            if (!preventHashChangeHandling) {
                preventHashChangeHandling = true;
                matchRules();
                preventHashChangeHandling = false;
            }
        });

        matchRules();

        return target;
    };
}
