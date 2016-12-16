import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import path from 'path'

export default {
  entry: path.resolve(__dirname, './boot.js'),
  dest: path.resolve(__dirname, './dist/app.js'),
  external: [
    'react',
    'react-dom',
    'react-redux',
    'redux'
  ],
  format: 'cjs',
  sourceMap: false,
  useStrict: false,
  plugins: [
    babel(),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
  ]
}