import { Renderer } from '../interface/Renderer';

export abstract class ProxyAdaptor {
    renderIdFieldsMapping = {};

    fieldsRenderIdMapping = {};

    renderer: Renderer;

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

    protected renderByFields(fields: string[]) {
        // get all render ids by fields
        const renderIds = fields.reduce((renderIds, field) => {
            const ids = this.fieldsRenderIdMapping[field] || [];
            return renderIds.concat(ids);
        }, []);
        // render by render ids
        renderIds.forEach((renderId) => {
            this.renderer.renderById(renderId);
        });
    }
}
