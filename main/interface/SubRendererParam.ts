export interface SubRendererParam {
    identity?: any;

    template?: string;

    context?: object | (() => object);
}
