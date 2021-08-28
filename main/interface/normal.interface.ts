import { HtmlRenderer } from '..';

export interface ExpressionRaw {
    raw: string[],
    expressions: string[]
}

export enum RenderType {
    TEXT = 'text',
    DIRECTIVE = 'directive',
    CHILD_PARSER = 'child_parser'
}

export interface RenderItem {
    id: string,
    type: RenderType,
    target?: any,
    renderer?: any,
    directive?: Directive,
    data?: any
}

export interface DirectiveHookParams {
    renderId?: string
    target?: Element,
    details: DirectiveDetails,
    trans: any
}

export interface Directive {
    afterMounted?: () => void
    beforeRendered?: (dom) => void
    afterRendered?: (dom) => void

    name: string,

    isScoped?: boolean,

    alias?: string,

    created?(...params: any[]): void

    destroyed?(...params: any[]): void

    render?(params: DirectiveHookParams): void

    defineScopes?(details: DirectiveDetails): any

    defineTemplates?(template: ScopeTemplate, details: DirectiveDetails): { [key: string]: HtmlRenderer }
}

export interface DirectiveDetails {
    key: string,
    attribute?: string,
    expression: string

    getDynamicResult?(): DirectiveDetailsResult
}

export interface DirectiveResultParams extends DirectiveDetails {
    attributeValue?: string,
    result: any
}

export interface DirectiveDetailsResult {
    key?: string
    attributeValue?: any,
    result?: any
}

export interface DirectiveArgs {
    [key: string]: string
}

export interface ScopeTemplate {

    from?(key: any, context?: any)

    forNew?(ele: Element, context?: any)

}