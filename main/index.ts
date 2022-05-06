import { configuration } from './configure';
import { genOrderedId } from '@rapidly/utils/lib/commom/genOrderedId';
import { ScopeManager } from './scopes/ScopeManager';
import { IfScope } from './scopes/IfScope';
import { TextScope } from './scopes/TextScope';
import { ForScope } from './scopes/ForScope';
import { TextStrategy } from './stragtegies/TextStrategy';
import { ForStrategy } from './stragtegies/ForStrategy';
import { AttrStrategy } from './stragtegies/AttrStrategy';
import { AttrScope } from './scopes/AttrScope';
import { IfStrategy } from './stragtegies/IfStrategy';
import { EventScope } from './scopes/EventScope';
import { EventStrategy } from './stragtegies/EventStrategy';
import { ElementSetterScope } from './scopes/ElementSetterScope';
import { ModelStrategy } from './stragtegies/ModelStrategy';

configuration.override({
    idGenerator: () => '_' + genOrderedId(),
    instances: {
        scopeManager: new ScopeManager()
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

export * from './configure';
export * from './scopes/TextScope';
export * from './scopes/ScopeManager';
export * from './scopes/IfScope';
export * from './context/AdaptedContext';
export * from './context/ProxyAdaptor';
export * from './component';
export * from './router';
