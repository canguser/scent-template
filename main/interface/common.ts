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
