export interface RenderScope<T = any> {
    id?: string;

    target: T;

    expression: string;

    render(context: object): void;
}
