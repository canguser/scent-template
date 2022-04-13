export function waitImmediately(context?: any, apiName: string = '_waitImmediatelyPS') {
    if (!context[apiName]) {
        context[apiName] = new Promise((resolve) => {
            setTimeout(() => {
                context[apiName] = undefined;
                delete context[apiName];
                resolve(undefined);
            }, 0);
        });
    }
    return context[apiName];
}

export function waitNextFrame(args?: any) {
    return new Promise(async (resolve) => {
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

const ref = window.requestAnimationFrame;

let uniqueInt = 0;

export function genUniqueId() {
    // return '_' + (Number(Math.random().toString().substr(3, 2)) + (Date.now() / 1000) + uniqueInt++).toString(36);
    return '_' + uniqueInt++;
}

export function genStrategyMapper(mapper = {}, defaultValue, ignoreCase = false) {
    return new Proxy(
        { ...mapper },
        {
            get(target, p, receiver) {
                if (
                    Object.getOwnPropertyNames(target)
                        .map<string | symbol>((name) => (ignoreCase ? name.toLowerCase() : name))
                        .includes(ignoreCase && typeof p === 'string' ? p.toLowerCase() : p)
                ) {
                    return Reflect.get(target, p, receiver);
                }
                return defaultValue;
            }
        }
    );
}

export function traversingTreeNode<NodeType = Node>(
    treeNode: NodeType,
    childProperty: keyof NodeType,
    callback,
    {
        parentNode,
        avoidModify = true
    }: {
        parentNode?: NodeType;
        avoidModify?: boolean;
    } = {}
) {
    if (!treeNode) {
        return;
    }
    let childNodes;
    if (avoidModify) {
        childNodes = [...(treeNode[childProperty] as any)];
    }
    const callbackResult = callback(treeNode, parentNode);
    const continueTraversing = callbackResult !== false;
    if (continueTraversing) {
        if (!childNodes) {
            childNodes = treeNode[childProperty] as any;
        }
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                traversingTreeNode(childNodes[i], childProperty, callback, {
                    parentNode: treeNode,
                    avoidModify
                });
            }
        }
    }
}

export function ergodicTree<NodeType>(tree: NodeType, childProperty: string = 'childNodes', parentNode?: NodeType) {
    return function (
        callback: (
            node: NodeType,
            parent: NodeType,
            preventDeeply?: () => void,
            extraNodes?: (...nodes) => void
        ) => void | Promise<void>
    ) {
        let prevent = false;
        let extraNodes = [];
        const result = callback(
            tree,
            parentNode,
            () => {
                prevent = true;
            },
            (...nodes) => {
                extraNodes = nodes || [];
            }
        );

        function doAfter() {
            if (!prevent) {
                const results = [...tree[childProperty], ...extraNodes].map((node) =>
                    ergodicTree(node, childProperty, tree)(callback)
                );
                const promises = results.filter((r) => r instanceof Promise);
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

export function getHostUrl(url) {
    return (url.match(/[a-z0-9]+:\/\/[^/]+/g) || [])[0] || '';
}

export function urlJoin(url, toPath) {
    const host = getHostUrl(url);
    return pathJoin(host + url.replace(host, '').replace(/\/[^\/]+$/, ''), toPath);
}

export function pathJoin(url: string, toPath: string | string[], split = '/') {
    const host = getHostUrl(url);
    if (/[a-z0-9]+:\/\/[^/]+$/.test(url)) {
        return url;
    }
    if (typeof toPath === 'string') {
        const toPathHost = getHostUrl(toPath);
        console.log(toPathHost);
        return pathJoin(url, toPath.replace(toPathHost, '').split(split), split);
    }
    if (toPath[0] === '') {
        url = host;
    }
    for (const p of toPath) {
        if (p === '.') {
            continue;
        }
        if (p === '..') {
            url = host + url.replace(host, '').replace(/\/[^\/]+$/, '');
            continue;
        }
        if (p) {
            url += split + p;
        }
    }
    return url;
}

export function hasDuplicate(array) {
    return array.some((item, index) => array.indexOf(item) !== index);
}

export function toDashName(name) {
    return name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
}

export function toCamelName(name) {
    return name.replace(/-([a-z])/g, (m, w) => w.toUpperCase());
}