import { BasicRouterOptions, Router } from './classes/Router';

const routerMap = new WeakMap();

const elements = [];

export function createRouter(options: BasicRouterOptions = {}): Element {
    const router = new Router(options);
    routerMap.set(router.target, router);
    elements.push(router.target);
    return router.target;
}

export function useRouter(target?: Element): Router {
    if (!target) {
        target = elements[0];
    }
    if (!target || elements.length > 1) {
        console.warn('useRouter: target is not defined or more than one router is created.');
        console.warn('useRouter: passing the target is recommended.');
    }
    return routerMap.get(target);
}
