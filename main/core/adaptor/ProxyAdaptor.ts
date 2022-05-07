import { ScopeManager } from '../scopes/managers/ScopeManager';

export class ProxyAdaptor {
    renderIdList = [];

    scopeManager: ScopeManager;

    doingsInTick: Array<() => void> = [];

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
                this.execTickDoings();
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

    execTickDoings() {
        this.doingsInTick.forEach((doing) => {
            doing();
        });
        this.doingsInTick = [];
    }

    public nextTick(doing: () => void): Promise<void> {
        if (doing && typeof doing === 'function') {
            this.doingsInTick.push(doing);
        }
        return new Promise((resolve) => {
            this.doingsInTick.push(resolve);
        });
    }
}
