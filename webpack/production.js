const { unpoly, unpolyMigrate, unpolyBootstrap } = require('./entries.js')

module.exports = [
  unpoly({ es: 'ESNext', min: false }),
  unpoly({ es: 'ESNext', min: true }),
  unpoly({ es: 'ES5', min: false }),
  unpoly({ es: 'ES5', min: true }),
  unpolyMigrate({ min: false }),
  unpolyMigrate({ min: true }),
  unpolyBootstrap({ version: 3, min: false }),
  unpolyBootstrap({ version: 3, min: true }),
  unpolyBootstrap({ version: 4, min: false }),
  unpolyBootstrap({ version: 4, min: true }),
  unpolyBootstrap({ version: 5, min: false }),
  unpolyBootstrap({ version: 5, min: true }),
]
