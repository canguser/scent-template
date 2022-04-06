import { ProxyAdaptor } from '../classes/ProxyAdaptor';

export interface Component {
    name?: string;
    data?: (...args: any[]) => object | void;
    template?: string;
    components?: {
        [key: string]: Component;
    };
}

export interface App extends Component {
    mount?: any;
    template?: never;
    adaptor?: ProxyAdaptor;
    replaceMounted?: boolean;
    autoInit?: boolean;
}


// idea interface
interface RenderScopeResult {
    replaceParent?: boolean;
    template?: string;
}

interface RenderScope<T> {
    parent?: RenderScope<T>;
    target?: T;

    render(context?: () => object): RenderScopeResult | void;
}
