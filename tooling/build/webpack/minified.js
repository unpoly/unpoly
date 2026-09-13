// Just the minified bundles, for `bin/test --minify` to build on demand.
//
// Deliberately not `ci.js`: that one spreads the development configs, so building it would
// rebuild the bundles the watcher owns and would start a second BuildStatusPlugin writing
// tmp/build-status.json underneath a running watcher. This config touches only `.min.js`
// files and carries no plugins.
//
// It covers every minified bundle the runner page can ask for, including the es6 one that
// `ci.js` has no row for — see distFilenames() in tooling/runner/config.mjs.
const { unpoly, unpolyMigrate } = require('./entries.js')

// Webpack does not rewrite a file whose content is unchanged, which would leave the timestamp
// that outdatedMinifiedFiles() compares stuck in the past — so editing only a spec, which
// cannot change these bundles, would trigger this build again on every run.
function alwaysEmit(config) {
  config.output.compareBeforeEmit = false
  return config
}

module.exports = [
  alwaysEmit(unpoly({ es: 'modern', min: true })),
  alwaysEmit(unpoly({ es: 'es6', min: true })),
  alwaysEmit(unpolyMigrate({ min: true })),
]
