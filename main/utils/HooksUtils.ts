type Callback = (...args: any[]) => any;

interface HooksRegisterOptions {
    once?: boolean
}

export class Hooks {

    private hookCallbacks: Array<{
        callback: Callback,
        options: HooksRegisterOptions
    }> = [];


    constructor(private context?: any) {
    }

    dispatch(...params: any[]) {
        (this.hookCallbacks || [])
            .filter(
                ({ callback, options }) => {
                    if (typeof callback === 'function') {
                        callback.apply(this.context || this, params);
                        return !options.once;
                    }
                    return false;
                }
            );

        for (const { callback, options } of this.hookCallbacks) {
            if (typeof callback === 'function') {

            }
        }
    }

    register(callback: Callback, options: HooksRegisterOptions = {}) {
        if (typeof callback === 'function') {
            options = {
                ...{ once: false },
                ...options
            };
            this.hookCallbacks.push({
                options, callback
            });
        }
    }
}


export class HooksInstance {
    hooks: { [key: string]: Hooks } = {};

    protected getHooks(identity) {
        let hooks = this.hooks[identity];
        if (!hooks || !(hooks instanceof Hooks)) {
            hooks = new Hooks(this);
            this.hooks[identity] = hooks;
        }
        return hooks;
    }

    registerHooks(identity: string, callback: Callback, options?: HooksRegisterOptions) {
        if (typeof callback === 'function') {
            this.getHooks(identity).register(callback, options);
        }
    }

    dispatchHooks(identity, ...params) {
        this.getHooks(identity).dispatch(...params);
    }

}