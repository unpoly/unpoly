const webpack = require('webpack')
const { merge, file, scriptPipeline, stylePipeline, minify } = require('./shared.js')

function unpoly({ es, min }) {
  return merge(
    file('./src/unpoly.js', `unpoly${es == 'es6' ? '.es6' : ''}${min ? '.min' : ''}.js`),
    scriptPipeline({ es }),
    es === 'es6' ? discardStyles(): stylePipeline(`unpoly${min ? '.min' : ''}.css`),
    minify(min),
  )
}

function unpolyMigrate({ min }) {
  return merge(
    file('./src/unpoly-migrate.js', `unpoly-migrate${min ? '.min' : ''}.js`),
    // Always transpile to ES5. I don't want multiple versions of this trivial file.
    scriptPipeline({ es: 'es6' }),
    minify(min),
  )
}

function unpolyBootstrap({ version, min }) {
  return merge(
    file(`./src/unpoly-bootstrap${version}.js`, `unpoly-bootstrap${version}${min ? '.min' : ''}.js`),
    scriptPipeline({ es: 'es6' }),
    // Always transpile to ES5. I don't want multiple versions of this trivial file.
    stylePipeline(`unpoly-bootstrap${version}${min ? '.min' : ''}.css`),
    minify(min),
  )
}

function specs({ es }) {
  return merge(
    file('./spec/specs.js', `specs${es === 'es6' ? '.es6' : ''}.js`),
    scriptPipeline({ es, lint: false }),
    es === 'es6' ? discardStyles() : stylePipeline('specs.css'),
    minify(false)
  )
}

function jasmine() {
  return merge(
    file('./spec/jasmine.js', `jasmine.js`),
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

module.exports = { unpoly, unpolyMigrate, unpolyBootstrap, specs, jasmine }
