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

export function toDashName(name) {
    return name
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '');
}

export function toCamelName(name) {
    return name.replace(/-([a-z])/g, (m, w) => w.toUpperCase());
}
