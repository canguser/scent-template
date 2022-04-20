declare function createContext(context: any, options: any): any;
declare const ele: Element;

const context = createContext({}, {});

const scopeId = context.scope.bindText(ele, { expression: '{expression}' });

const ifScopeId = context.scope.bindIf(ele, {
    expression: 'expression',
    subScopes: (_ele, _context) => {
        const scopeId = _context.scope.bindText(_ele, { expression: 'expression' });
        return [scopeId];
    }
});

const forScopeId = context.scope.bindFor(ele, {
    expression: 'expression',
    subScopes: (_ele, _context) => {
        const scopeId = _context.scope.bindText(_ele, { expression: 'expression' });
        return [scopeId];
    }
});