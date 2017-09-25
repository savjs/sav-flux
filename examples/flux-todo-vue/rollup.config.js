import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import vue from 'rollup-plugin-vue'
import path from 'path'

export default {
  entry: path.resolve(__dirname, './boot.js'),
  dest: path.resolve(__dirname, './dist/app.js'),
  format: 'iife',
  moduleName: 'app',
  sourceMap: false,
  useStrict: false,
  external: [
    'vue',
    'vue-router'
  ],
  plugins: [
    vue(),
    babel({
      babelrc: false,
      externalHelpers: false,
      exclude: 'node_modules/**',
      'plugins': [
        ['transform-object-rest-spread', { 'useBuiltIns': true }]
      ]
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
  ]
}