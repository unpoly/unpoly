const { unpoly, unpolyMigrate, unpolyBootstrap, specs, jasmine } = require('./entries.js')
const { withSourceMaps } = require('./shared.js')
// The runner's build-status plugin lives with the rest of the runner. Node 22 lets
// this CommonJS config require() an ESM module.
const { BuildStatusPlugin } = require('../runner/terminal/build_status.mjs')

const configs = withSourceMaps([
  unpoly({ es: 'modern', min: false }),
  unpoly({ es: 'es6', min: false }),
  unpolyMigrate({ min: false }),
  unpolyBootstrap({ version: 3, min: false }),
  unpolyBootstrap({ version: 4, min: false }),
  unpolyBootstrap({ version: 5, min: false }),
  specs({ es: 'modern', min: false }),
  specs({ es: 'es6', min: false }),
  jasmine()
])

// One shared plugin instance across all sub-compilers, so its counter tracks all
// in-flight builds and only writes "idle" once every current rebuild has finished
// (see runner/terminal/build_status.mjs). This is what the dev runner waits on.
const buildStatus = new BuildStatusPlugin()
for (const config of configs) {
  (config.plugins ||= []).push(buildStatus)
}

module.exports = configs
