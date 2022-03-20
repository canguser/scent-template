import { Renderer } from '../interface/Renderer';

export abstract class ProxyAdaptor {

    fieldsMapping = [];

    protected constructor(protected context: any, protected renderer: Renderer) {
        renderer.watchSingleRender(
            (renderId) => {
                this.startListenGetter((field) => {});
            },
            (renderId) => {}
        );
    }

    abstract startListenGetter(cb: (field: string) => void): void;
}
