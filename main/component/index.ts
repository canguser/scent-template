import { AdaptedContext } from '../context/AdaptedContext';
import { configuration } from '../configure';
import { ScopeManager } from '../scopes/ScopeManager';
import { traversingTreeNode } from '../utils/NormalUtils';
import { BasicStrategy } from '../stragtegies/BasicStrategy';
import { StrategyType } from '../enum/StrategyType';

export type ComponentFn = (props: any) => DocumentFragment;

export interface ComponentOptions {
    components?: {
        [key: string]: ComponentFn;
    };
    template: string;
    setup?: (props, target?: any) => object;
}

export function defineComponent(options: ComponentOptions): ComponentFn {
    return (props: any) => {
        props = props || {};
        const adaptor = configuration.get<ScopeManager>('instances.scopeManager').proxyAdaptor;
        const strategies = configuration.get<BasicStrategy[]>('strategies') || [];
        const template = document.createElement('template');
        template.innerHTML = options.template;
        const context = new AdaptedContext({
            ...options.setup?.(props),
            $props: adaptor.create(props, true)
        });

        const result = template.content;

        traversingTreeNode(result, 'childNodes', (node) => {
            let canGoDeep = true;
            for (let strategy of strategies) {
                let result = strategy.match(node as Element, context);
                if (result) {
                    if ([StrategyType.Alienated, StrategyType.Alienated_UNIQUE].includes(strategy.type)) {
                        canGoDeep = false;
                    }
                    if (strategy.type === StrategyType.Alienated_UNIQUE) {
                        break;
                    }
                }
            }
            return canGoDeep;
        });

        return result;
    };
}
