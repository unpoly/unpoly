const { unpoly, unpolyMigrate, unpolyBootstrap, artifacts } = require('./entries.js')

module.exports = [
  unpoly({ es: 'modern', min: false }),
  unpoly({ es: 'modern', min: true }),
  unpoly({ es: 'es6', min: false }),
  unpoly({ es: 'es6', min: true }),
  unpolyMigrate({ min: false }),
  unpolyMigrate({ min: true }),
  unpolyBootstrap({ version: 3, min: false }),
  unpolyBootstrap({ version: 3, min: true }),
  unpolyBootstrap({ version: 4, min: false }),
  unpolyBootstrap({ version: 4, min: true }),
  unpolyBootstrap({ version: 5, min: false }),
  unpolyBootstrap({ version: 5, min: true }),
  artifacts()
]
