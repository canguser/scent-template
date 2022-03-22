import { SubRendererParam } from './SubRendererParam';

export interface RenderResult{
    replaceParent?: boolean;

    rendererParams?: SubRendererParam[]
}