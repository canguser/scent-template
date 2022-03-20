import { Renderer } from '../interface/Renderer';
import { RenderScope } from '../interface/RenderScope';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';

export abstract class BasicRenderer<T> implements Renderer<T> {
    context: object;

    children: Renderer<T>[] = [];
    parent: Renderer<T>;
    realElement: T;
    scopesMapper: { [id: string]: RenderScope } = {};
    virtualElement: T;

    singleRenderWatchingMapping: {
        [id: string]: {
            before: (scopeId: string) => void;
            after: (scopeId: string) => void;
        };
    } = {};

    abstract compile(): void;

    abstract mount(target?: T): void;

    public render(): void {
        const scopeIds = Object.keys(this.scopesMapper) || [];
        scopeIds.forEach((id) => {
            this.renderById(id);
        });
        this.children.forEach((child) => {
            child.render();
        });
    }

    public renderById(id: string): void {
        const scope = this.scopesMapper[id];
        if (scope) {
            this.notifyBeforeSingleRender(id);
            scope.render(this.context);
            this.notifyAfterSingleRender(id);
        } else {
            this.children.forEach((child) => {
                child.renderById(id);
            });
        }
    }

    abstract unmount(): void;

    renderByIdList(ids: string[]): void {
        ids.forEach((id) => {
            this.renderById(id);
        });
    }

    notifyBeforeSingleRender(id: string): void {
        Object.keys(this.singleRenderWatchingMapping).forEach((key) => {
            const watching = this.singleRenderWatchingMapping[key];
            if (watching && typeof watching.before === 'function') {
                watching.before(id);
            }
        });
    }

    notifyAfterSingleRender(id: string): void {
        Object.keys(this.singleRenderWatchingMapping).forEach((key) => {
            const watching = this.singleRenderWatchingMapping[key];
            if (watching && typeof watching.after === 'function') {
                watching.after(id);
            }
        });
    }

    watchSingleRender(before: (scopeId: string) => void, after: (scopeId: string) => void): string {
        const id = genOrderedId();
        this.singleRenderWatchingMapping[id] = {
            before,
            after
        };
        return id;
    }

    unwatchSingleRender(id: string): void {
        delete this.singleRenderWatchingMapping[id];
    }
}
