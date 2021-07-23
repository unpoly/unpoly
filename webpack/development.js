const { unpoly, unpolyMigrate, unpolyBootstrap, specs, jasmine } = require('./entries.js')

module.exports = [
  unpoly({ es: 'modern', min: false }),
  unpoly({ es: 'es5', min: false }),
  unpolyMigrate({ min: false }),
  unpolyBootstrap({ version: 3, min: false }),
  unpolyBootstrap({ version: 4, min: false }),
  unpolyBootstrap({ version: 5, min: false }),
  specs({ es: 'modern', min: false }),
  specs({ es: 'es5', min: false }),
  jasmine()
]
