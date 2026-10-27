// Under Jest (NODE_ENV=test), compile for the Node running the tests: the
// default targets turn async functions into generators that need
// regeneratorRuntime, which isn't loaded. Anything else gets the same
// presets as before.
module.exports = api => ({
  presets: [
    [
      '@babel/preset-env',
      api.env('test') ? { targets: { node: 'current' } } : {}
    ],
    '@babel/preset-react'
  ]
});
