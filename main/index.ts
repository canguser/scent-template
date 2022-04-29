import { configuration } from './configure';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';
import { ScopeManager } from './scopes/ScopeManager';
import { IfScope } from './scopes/IfScope';
import { TextScope } from './scopes/TextScope';
import { ForScope } from './scopes/ForScope';
import { TextStrategy } from './stragtegies/TextStrategy';
import { ForStrategy } from './stragtegies/ForStrategy';

configuration.override({
    idGenerator: () => '_' + genOrderedId(),
    instances: {
        scopeManager: new ScopeManager()
    },
    scopes: {
        if: IfScope,
        text: TextScope,
        for: ForScope
    },
    strategies: [new ForStrategy(), new TextStrategy()]
});

export * from './configure';
export * from './scopes/TextScope';
export * from './scopes/ScopeManager';
export * from './scopes/IfScope';
export * from './context/AdaptedContext';
export * from './context/ProxyAdaptor';
export * from './component';
