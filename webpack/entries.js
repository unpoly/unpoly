const webpack = require('webpack')
const { merge, entry, scriptPipeline, stylePipeline, minify, copy } = require('./shared.js')

function unpoly({ es, min }) {
  return merge(
    entry('./src/unpoly.js', `unpoly${es == 'es6' ? '.es6' : ''}${min ? '.min' : ''}.js`),
    scriptPipeline({ es }),
    es === 'es6' ? discardStyles(): stylePipeline(`unpoly${min ? '.min' : ''}.css`),
    minify(min),
  )
}

function unpolyMigrate({ min }) {
  return merge(
    entry('./src/unpoly-migrate.js', `unpoly-migrate${min ? '.min' : ''}.js`),
    // Always transpile to ES5. I don't want multiple versions of this trivial file.
    scriptPipeline({ es: 'es6' }),
    minify(min),
  )
}

function unpolyBootstrap({ version, min }) {
  return merge(
    entry(`./src/unpoly-bootstrap${version}.js`, `unpoly-bootstrap${version}${min ? '.min' : ''}.js`),
    scriptPipeline({ es: 'es6' }),
    // Always transpile to ES5. I don't want multiple versions of this trivial file.
    stylePipeline(`unpoly-bootstrap${version}${min ? '.min' : ''}.css`),
    minify(min),
  )
}

function specs({ es }) {
  return merge(
    entry('./spec/specs.js', `specs${es === 'es6' ? '.es6' : ''}.js`),
    scriptPipeline({ es, lint: false }),
    es === 'es6' ? discardStyles() : stylePipeline('specs.css'),
    minify(false)
  )
}

function jasmine() {
  return merge(
    entry('./spec/jasmine.js', `jasmine.js`),
    scriptPipeline({ es: 'es6', lint: false }),
    stylePipeline('jasmine.css'),
    minify(false),
    { // node: { fs: 'empty' }, // fix "Error: Can't resolve 'fs'
      plugins: [new webpack.ProvidePlugin({
        jasmineRequire: 'jasmine-core/lib/jasmine-core/jasmine.js',
        getJasmineRequireObj: [__dirname + '/get_jasmine_require_obj.js', 'default'],
      })]
    }
  )
}

function artifacts() {
  return merge(
    copy(__dirname + '/../package.json')
    // copy('./LICENSE'),
    // copy('./README.md'),
    // copy('./CHANGELOG.md'),
  )
}

module.exports = { unpoly, unpolyMigrate, unpolyBootstrap, specs, jasmine, artifacts }
