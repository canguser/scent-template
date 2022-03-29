export interface SubRendererParam {
    identity?: any;

    template?: string;

    context?: object | (() => object);

    scopeOptions?: { [key: string]: any };
}
