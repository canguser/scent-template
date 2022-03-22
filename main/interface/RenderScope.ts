import { RenderResult } from './RenderResult';

export interface RenderScope<T = any> {
    id?: string;

    target: T;

    expression: string;

    render(context: object): void | RenderResult;
}
