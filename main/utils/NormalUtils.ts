export function waitImmediately(args?: any) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(args);
        }, 0);
    });
}