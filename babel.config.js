module.exports = {
    'presets': [
        [
            '@babel/preset-env',
            {
                'modules': false
            }
        ],
        '@babel/typescript'
    ],
    'plugins': [
        ['@babel/plugin-transform-runtime'],
        ['@babel/plugin-proposal-class-properties'],
        ['@babel/plugin-proposal-object-rest-spread', { 'loose': true, 'useBuiltIns': true }]
    ],
    'ignore': [
        'node_modules/**'
    ]
}