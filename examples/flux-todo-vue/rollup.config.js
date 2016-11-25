import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import vue from 'rollup-plugin-vue2'
import path from 'path'

export default {
  entry: path.resolve(__dirname, './boot.js'),
  dest: path.resolve(__dirname, './dist/app.js'),
  format: 'cjs',
  sourceMap: false,
  useStrict: false,
  plugins: [
    vue(),
    buble({
      objectAssign: 'Object.assign'
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
  ]
}