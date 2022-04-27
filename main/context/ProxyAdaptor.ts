import { ScopeManager } from '../scopes/ScopeManager';

export class ProxyAdaptor {
    renderIdList = [];

    scopeManager: ScopeManager;

    initialize() {}

    public create<T extends object = object>(context: T, readonly?: boolean): T {
        return { ...context } as T;
    }

    public async renderIds(...ids) {
        for (let id of ids) {
            if (this.renderIdList.indexOf(id) === -1) {
                this.renderIdList.push(id);
            }
        }
        if (this.scopeManager) {
            await this.waitNextFrame();
            if (this.renderIdList.length > 0) {
                console.time('rendered');
                while (this.renderIdList.length > 0) {
                    const renderIds = this.renderIdList.splice(0);
                    // console.log('render ids', renderIds);
                    renderIds.forEach((id) => {
                        this.scopeManager.renderById(id);
                    });
                }
                console.timeEnd('rendered');
            }
        }
    }

    waitNextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                resolve(undefined);
            });
        });
    }
}
