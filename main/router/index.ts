import { BasicRouterOptions, Route, Router } from './classes/Router';

const routerMap = new WeakMap();

const elements = [];

export function createRouter(options: BasicRouterOptions = {}): Element {
    const router = new Router(options);
    routerMap.set(router.target, router);
    elements.push(router.target);
    router.apply();
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

export function useRoute(target?: Element): Route {
    const router = useRouter(target);
    if (router) {
        return router.route;
    }
    console.warn('useRoute: router is not defined.');
    return {};
}

export function pushRoute(
    pathOrName: string,
    params?: { [key: string]: any },
    query?: { [key: string]: any },
    target?: Element
): void {
    const router = useRouter(target);
    if (router) {
        router.push(pathOrName, params, query);
    }
}
