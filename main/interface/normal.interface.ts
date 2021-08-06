export interface ExpressionRaw {
    raw: string[],
    expressions: string[]
}

export enum RenderType {
    TEXT = 'text'
}

export interface RenderItem {
    id: string,
    type: RenderType.TEXT,
    target?: any,
    data?: any
}