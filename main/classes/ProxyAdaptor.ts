import { Renderer } from '../interface/Renderer';
import { debounce } from '@rapidly/utils/lib/commom/async/debounce';
import { waitNextFrame } from '../utils/NormalUtils';

export abstract class ProxyAdaptor {
    renderIdFieldsMapping = {};

    fieldsRenderIdMapping = {};

    renderer: Renderer;

    toRenderFields = [];

    doingsInTick: Array<() => void> = [];

    adapt(renderer: Renderer) {
        this.renderer = renderer;
        this.initialize();
    }

    initialize() {
        this.renderer.watchSingleRender(
            (renderId) => {
                this.renderIdFieldsMapping[renderId] = [];
                this.startListenGetter((field) => {
                    const fields = this.renderIdFieldsMapping[renderId] || [];
                    if (fields.indexOf(field) === -1) {
                        fields.push(field);
                        this.renderIdFieldsMapping[renderId] = fields;
                    }
                });
            },
            (renderId) => {
                this.stopListenGetter();
                const fields = this.renderIdFieldsMapping[renderId] || [];
                fields.forEach((field) => {
                    const ids = this.fieldsRenderIdMapping[field] || [];
                    if (ids.indexOf(renderId) === -1) {
                        ids.push(renderId);
                        this.fieldsRenderIdMapping[field] = ids;
                    }
                });
                this.renderIdFieldsMapping[renderId] = [];
            }
        );
    }

    startListenGetter(cb: (field: string) => void): void {}

    stopListenGetter(): void {}

    protected async renderByFields(fields: string[]) {
        // waiting for all fields to be rendered
        this.toRenderFields.push(...fields);
        await debounce({ context: this, during: 0 });
        if (this.toRenderFields.length) {
            const allRenderFieldsUnique = [...new Set(this.toRenderFields)];
            // get all render ids by fields
            const renderIds = allRenderFieldsUnique.reduce((renderIds, field) => {
                const ids = this.fieldsRenderIdMapping[field] || [];
                // clear the mapping of field to render ids, will re-fill it in next render
                this.fieldsRenderIdMapping[field] = [];
                for (const id of ids) {
                    if (renderIds.indexOf(id) === -1) {
                        renderIds.push(id);
                    }
                }
                return renderIds;
            }, []);
            // clear the fields stacks for next sticky render
            this.toRenderFields = [];
            // render by render ids
            if (renderIds.length > 0) {
                console.time('render time');
                console.log('render ids', renderIds);
                await Promise.all(
                    renderIds.map((renderId) => {
                        return waitNextFrame().then(() => {
                            this.renderer.renderById(renderId);
                        });
                    })
                );
                console.timeEnd('render time');
            }
        }
    }

    abstract create(data: object, readonly?: boolean): object;

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
