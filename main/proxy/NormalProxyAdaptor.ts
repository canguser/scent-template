import { ProxyAdaptor } from '../classes/ProxyAdaptor';
import { get, parseChain, subscribe } from '@scent/proxies';

export class NormalProxyAdaptor extends ProxyAdaptor {
    subscriber: any;

    constructor(context: object) {
        super(context);
        subscribe(context, {
            set: (target, propertyChain, value, old) => {
                const properties = parseChain(propertyChain);
                const lastProperty = properties.splice(properties.length - 1, 1)[0];
                const lastParent = get(target, properties);
                if (value !== old || (Array.isArray(lastParent) && lastProperty === 'length')) {
                    this.renderByFields([propertyChain])
                        .then(() =>{
                            console.log('render success');
                        });
                }
            }
        });
    }

    startListenGetter(cb: (field: any) => void): void {
        this.subscriber = subscribe('all', {
            get: (target, propertyChain) => {
                cb(propertyChain);
            }
        });
    }

    stopListenGetter(): void {
        this.subscriber.stop();
    }
}
