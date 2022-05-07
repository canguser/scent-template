import { configuration } from './core/configure';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';
import { ScopeManager } from './core/scopes/managers/ScopeManager';
import { IfScope } from './core/scopes/IfScope';
import { TextScope } from './core/scopes/TextScope';
import { ForScope } from './core/scopes/ForScope';
import { TextStrategy } from './template/stragtegies/TextStrategy';
import { ForStrategy } from './template/stragtegies/ForStrategy';
import { AttrStrategy } from './template/stragtegies/AttrStrategy';
import { AttrScope } from './core/scopes/AttrScope';
import { IfStrategy } from './template/stragtegies/IfStrategy';
import { EventScope } from './core/scopes/EventScope';
import { EventStrategy } from './template/stragtegies/EventStrategy';
import { ElementSetterScope } from './core/scopes/ElementSetterScope';
import { ModelStrategy } from './template/stragtegies/ModelStrategy';
import { GlobalContext } from './core/context/GlobalContext';
import { merge } from '@rapidly/utils/lib/commom/object/merge';
configuration.override({
    idGenerator: () => '_' + genOrderedId(),
    instances: {
        scopeManager: new ScopeManager(),
        globalContext: new GlobalContext()
    },
    scopes: {
        if: IfScope,
        text: TextScope,
        for: ForScope,
        attr: AttrScope,
        event: EventScope,
        setter: ElementSetterScope
    },
    strategies: [
        new ForStrategy(),
        new IfStrategy(),
        new AttrStrategy(),
        new EventStrategy(),
        new ModelStrategy(),
        new TextStrategy()
    ]
});

export const globalVars = GlobalContext.prototype as any;

export * from './core/configure';
export * from './core/scopes/TextScope';
export * from './core/scopes/managers/ScopeManager';
export * from './core/scopes/IfScope';
export * from './core/context/AdaptedContext';
export * from './core/adaptor/ProxyAdaptor';
export * from './template/component';
export * from './router';
