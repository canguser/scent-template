import { HtmlRenderer } from '..';

export interface ExpressionRaw {
    raw: string[],
    expressions: string[]
}

export enum RenderType {
    TEXT = 'text',
    DIRECTIVE = 'directive'
}

export interface RenderItem {
    id: string,
    type: RenderType,
    target?: any,
    renderer?: any,
    data?: any
}

export interface DirectiveHookParams {
    target: Element,
    params: DirectiveParams,
    trans: any
}

export interface Directive {
    created?: () => void
    afterMounted?: () => void
    beforeRendered?: (dom) => void
    afterRendered?: (dom) => void
    name: string,

    isScoped?: boolean,
    scopedContext?: any,

    render?(params: DirectiveHookParams): void

    defineScope?(dom, params: DirectiveParams): HtmlRenderer[]
}

export interface DirectiveParams {
    key: string,
    attribute?: string,
    expression: string
}

export interface DirectiveArgs {
    [key: string]: string
}