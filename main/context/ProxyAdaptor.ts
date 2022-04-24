export abstract class ProxyAdaptor {
    public abstract create<T extends object = object>(context: T, readonly?: boolean): T;

}