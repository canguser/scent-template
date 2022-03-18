export interface RenderScope{

    id?: string;

    target: any

    expression: string

    render(context: object): void;

}