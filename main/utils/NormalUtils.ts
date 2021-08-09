export function waitImmediately(args?: any) {
    return new Promise(resolve => {
        setTimeout(resolve, 0);
    });
}

export function waitNextFrame(args?: any) {
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

export function ergodicTree<NodeType>(tree: NodeType, childProperty: string = 'childNodes', parentNode?: NodeType) {
    return function(callback: (node: NodeType, parent: NodeType, preventDeeply: () => void) => void | Promise<void>) {
        let prevent = false;
        const result = callback(tree, parentNode, () => {
            prevent = true;
        });

        function doAfter() {
            if (!prevent) {
                const results = [...tree[childProperty]].map(node => ergodicTree(node, childProperty, tree)(callback));
                const promises = results.filter(r => r instanceof Promise);
                if (promises.length > 0) {
                    return Promise.all(results);
                }
                return results;
            }
        }

        if (result instanceof Promise) {
            return result.then(() => doAfter());
        }

        return doAfter();
    };
}

export function compatiblePromise(result, callback) {
    if (result instanceof Promise) {
        return result.then(callback);
    } else {
        return callback(result);
    }
}

// function ergodicTree(tree, childProperty = 'childNodes', parentNode) {
//     return function(callback) {
//         let prevent = false;
//         callback(tree, parentNode, () => {
//             prevent = true;
//         });
//         if (!prevent) {
//             [...tree[childProperty]].forEach(node => {
//                 ergodicTree(node, childProperty, tree)(callback);
//             });
//         }
//     };
// }