
export interface BasicScopeOptions{

}

export abstract class BasicScope<T = Element> {

    protected constructor(protected target: T, options?: BasicScopeOptions) {
    }



}
