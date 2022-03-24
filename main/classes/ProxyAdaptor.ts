import { Renderer } from '../interface/Renderer';
import { debounce } from '@rapidly/utils/lib/commom/async/debounce';
import { waitNextFrame } from '../utils/NormalUtils';

export abstract class ProxyAdaptor {
    renderIdFieldsMapping = {};

    fieldsRenderIdMapping = {};

    renderer: Renderer;

    toRenderFields = [];

    protected constructor(protected context: any) {}

    adapt(renderer: Renderer) {
        this.renderer = renderer;
        renderer.watchSingleRender(
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
            console.time('render time');
            const allRenderFieldsUnique = [...new Set(this.toRenderFields)];
            // get all render ids by fields
            const renderIds = allRenderFieldsUnique.reduce((renderIds, field) => {
                const ids = this.fieldsRenderIdMapping[field] || [];
                // clear the mapping of field to render ids, will re-fill it in next render
                this.fieldsRenderIdMapping[field] = [];
                return renderIds.concat(ids);
            }, []);
            // clear the fields stacks for next sticky render
            this.toRenderFields = [];
            // render by render ids
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
