const { unpoly, unpolyMigrate } = require('./entries.js')
const devExports = require('./development.js')

module.exports = [
  ...devExports,
  unpoly({ es: 'modern', min: true }),
  unpolyMigrate({ min: true }),
]
