const {executeRollup} = require('rollup-standalone')

module.exports = executeRollup({
  entry: './boot.js',
  dest: 'bundle.js',
  format: 'iife',
  commonjsOptions: {
    include: [
      '../../node_modules/**',
      'node_modules/**',
    ]
  },
  patterns: [
    {
      test: 'process.env.NODE_ENV',
      replace: "'production'"
    }
  ]
})
