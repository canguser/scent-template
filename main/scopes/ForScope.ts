import { BasicScope, BasicScopeOptions } from './BasicScope';
import { execExpression } from '@rapidly/utils/lib/commom/string/execExpression';
import { Context } from '../context/Context';
import { ProxyContext } from '../context/ProxyContext';
import { diffFrom } from '../utils/NormalUtils';

export interface ForScopeOptions extends BasicScopeOptions {
    index?: string;
    item: string;
    of: string;
    key?: string;
}

export class ForScope extends BasicScope<Element, ForScopeOptions> {
    keyTargetsMapping: { [key: string]: Element } = {};

    placeholder: Comment;
    parentNode: Node;
    existedKeys: string[] = [];

    protected readonly aggregated = true;

    getPlaceholder() {
        return this.placeholder || (this.placeholder = document.createComment('for' + this.id));
    }

    getParentNode() {
        return this.parentNode || (this.parentNode = this.target.parentNode);
    }

    keyIndexMap: { [key: string]: number } = {};

    render(): void {
        const parentNode = this.getParentNode();
        if (this.target.parentNode) {
            const placeholder = this.getPlaceholder();
            parentNode.replaceChild(placeholder, this.target);
        }
        const items = this.items;
        const key = this.options.key;
        let keys = items.map((item, i) => item[key] ?? i);
        const hasDuplicateKeys = keys.some((key, index) => keys.indexOf(key) !== index);
        if (hasDuplicateKeys) {
            keys = items.map((item, i) => i + '');
            console.warn('[Rapidly] For scope has duplicate keys, use index as key instead.');
        }
        const existedKeys = this.existedKeys;
        const diffs = diffFrom(existedKeys, keys);
        for (const diff of diffs) {
            if (diff.remove) {
                this.destroyKey(diff.key);
                existedKeys.splice(diff.index, 1);
                continue;
            }
            if (diff.change) {
                const fragment = document.createDocumentFragment();
                diff.keys.forEach((key) => {
                    fragment.appendChild(this.keyTargetsMapping[key]);
                });
                const toIndex = diff.offsetIndex;
                const existedLength = existedKeys.length;
                if (toIndex === existedLength - 1) {
                    parentNode.insertBefore(fragment, this.getPlaceholder());
                } else {
                    parentNode.insertBefore(fragment, this.keyTargetsMapping[existedKeys[toIndex + 1]]);
                }
                continue;
            }
            if (diff.add) {
                const fragment = document.createDocumentFragment();
                diff.keys.forEach((key) => {
                    const ele = (this.keyTargetsMapping[key] = this.target.cloneNode(true) as Element);
                    fragment.appendChild(ele);
                });
                const toIndex = diff.index;
                if (toIndex === existedKeys.length) {
                    parentNode.insertBefore(fragment, this.getPlaceholder());
                } else {
                    parentNode.insertBefore(fragment, this.keyTargetsMapping[existedKeys[toIndex]]);
                }
            }
        }
        this.existedKeys = keys;
        this.keyIndexMap = {};
        this.putScopeInfos(
            this.existedKeys.map((key, i) => {
                this.keyIndexMap[key] = i;
                return {
                    key,
                    target: this.keyTargetsMapping[key]
                };
            })
        );
    }

    private destroyKey(key: string) {
        const target = this.keyTargetsMapping[key];
        if (target && target.parentNode) {
            target.parentNode.removeChild(target);
        }
        delete this.keyTargetsMapping[key];
    }

    get items(): any[] {
        return execExpression(this.options.of, this.getContextObject()) || [];
    }

    getItemIndex(key: string): number {
        return this.keyIndexMap[key];
    }

    protected getSubContext(key: string): Context {
        return new ProxyContext<object>({} as object, {
            proxyHandler: {
                get: (target, p) => {
                    if (p === (this.options.index || '$index')) {
                        return this.getItemIndex(key);
                    }
                    if (p === (this.options.item || '$item')) {
                        const index = this.getItemIndex(key);
                        return this.items[index];
                    }
                    return this.getContextObject()[p];
                },
                set: (target, p, value) => {
                    if (p === (this.options.item || '$item')) {
                        const index = this.getItemIndex(key);
                        const items = this.items || [];
                        items[index] = value;
                        return true;
                    }
                    this.getContextObject()[p] = value;
                    return true;
                }
            }
        });
    }
}
