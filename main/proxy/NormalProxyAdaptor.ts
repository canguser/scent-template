import { ProxyAdaptor } from '../classes/ProxyAdaptor';
import { get, parseChain, react, subscribe } from '@scent/proxies';

export class NormalProxyAdaptor extends ProxyAdaptor {
    subscriber: any;

    initialize() {
        super.initialize();
    }

    startListenGetter(cb: (field: any) => void): void {
        // this.subscriber = subscribe(this.context, {
        //     get: (target, propertyChain) => {
        //         cb(propertyChain);
        //     }
        // });
    }

    stopListenGetter(): void {
        // this.subscriber.stop();
    }

    create(data: object): object {
        return react(data);
    }
}
