const { unpoly, unpolyMigrate, unpolyBootstrap, specs, jasmine } = require('./entries.js')

module.exports = [
  unpoly({ es: 'ESNext', min: false }),
  unpoly({ es: 'ES5', min: false }),
  unpolyMigrate({ min: false }),
  unpolyBootstrap({ version: 3, min: false }),
  unpolyBootstrap({ version: 4, min: false }),
  unpolyBootstrap({ version: 5, min: false }),
  specs({ es: 'ESNext', min: false }),
  specs({ es: 'ES5', min: false }),
  jasmine()
]
