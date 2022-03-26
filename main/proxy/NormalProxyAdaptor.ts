import { ProxyAdaptor } from '../classes/ProxyAdaptor';
import { get, parseChain, subscribe } from '@scent/proxies';

export class NormalProxyAdaptor extends ProxyAdaptor {
    subscriber: any;

    initialize() {
        super.initialize();
        console.log(this.context);
        subscribe(this.context, {
            set: (target, propertyChain, value, old) => {
                const properties = parseChain(propertyChain);
                const lastProperty = properties.splice(properties.length - 1, 1)[0];
                const lastParent = get(target, properties);
                if (value !== old || (Array.isArray(lastParent) && lastProperty === 'length')) {
                    this.renderByFields([propertyChain]);
                }
            }
        });
    }

    startListenGetter(cb: (field: any) => void): void {
        this.subscriber = subscribe(this.context, {
            get: (target, propertyChain) => {
                cb(propertyChain);
            }
        });
    }

    stopListenGetter(): void {
        this.subscriber.stop();
    }
}
