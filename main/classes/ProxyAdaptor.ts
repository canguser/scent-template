import { Renderer } from '../interface/Renderer';
import { debounce } from '@rapidly/utils/lib/commom/async/debounce';

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

    abstract startListenGetter(cb: (field: string) => void): void;

    abstract stopListenGetter(): void;

    protected async renderByFields(fields: string[]) {
        // waiting for all fields to be rendered
        this.toRenderFields.push(...fields);
        await debounce({ context: this, during: 0 });
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
        renderIds.forEach((renderId) => {
            this.renderer.renderById(renderId);
        });
        console.timeEnd('render time');
    }
}
