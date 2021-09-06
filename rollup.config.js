import resolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';

const { NODE_ENV = 'normal' } = process.env;
const pkg = require('./package') || {};
const {
    main = 'dist/index.js',
    mainMini = 'dist/index.mini.js',
    module = 'dist/index.es.js',
    moduleOrigin = 'dist/index.origin.esm.js',
    libName = '$func'
} = pkg;

const isESM = ['esm', 'esm5'].includes(NODE_ENV);
const isProd = ['prod'].includes(NODE_ENV);
const extensions = ['.js', '.ts'];

const fileMapper = {
    esm5: module,
    prod: mainMini,
    normal: main,
    esm: moduleOrigin
};

export default {
    input: './main/index.ts',
    output: {
        file: fileMapper[NODE_ENV] || main,
        format: isESM ? 'esm' : 'umd',
        name: libName
    },
    plugins: [
        typescript(),
        nodePolyfills(),
        resolve({
            extensions
            // modulesOnly: true
        }),
        commonjs(),
        ...isProd ? [terser()] : []
    ]
};