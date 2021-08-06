export function waitImmediately(args?: any) {
    return new Promise(async resolve => {
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => {
                resolve(args);
            });
        } else {
            await Promise.resolve();
            resolve(args);
        }
    });
}

let uniqueInt = -9999999;

export function genUniqueId() {
    // return '_' + (Number(Math.random().toString().substr(3, 2)) + (Date.now() / 1000) + uniqueInt++).toString(36);
    return '_' + uniqueInt++;
}

export function genStrategyMapper(mapper = {}, defaultValue, ignoreCase = false) {
    return new Proxy({ ...mapper }, {
        get(target, p, receiver) {
            if (Object.getOwnPropertyNames(target)
                .map<string | symbol>(name => ignoreCase ? name.toLowerCase() : name).includes((ignoreCase && typeof p === 'string') ? p.toLowerCase() : p)) {
                return Reflect.get(target, p, receiver);
            }
            return defaultValue;
        }
    });
}