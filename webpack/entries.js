const webpack = require('webpack')
const { merge, file, scriptPipeline, stylePipeline, minify } = require('./shared.js')

function unpoly({ es, min }) {
  return merge(
    file('./lib/assets/javascripts/unpoly.coffee', `unpoly${es == 'ES5' ? '.es5' : ''}${min ? '.min' : ''}.js`),
    scriptPipeline(es),
    es === 'ESNext' ? stylePipeline('unpoly.css') : discardStyles(),
    minify(min),
  )
}

function unpolyMigrate({ min }) {
  return merge(
    file('./lib/assets/javascripts/unpoly-migrate.coffee', `unpoly-migrate${min ? '.min' : ''}.js`),
    scriptPipeline('ES5'),
    minify(min),
  )
}

function unpolyBootstrap({ version, min }) {
  return merge(
    file(`./lib/assets/javascripts/unpoly-bootstrap${version}.coffee`, `unpoly-bootstrap${version}${min ? '.min' : ''}.js`),
    scriptPipeline('ES5'),
    stylePipeline(`unpoly-bootstrap${version}.css`),
    minify(min),
  )
}

function specs({ es }) {
  return merge(
    file('./spec/specs.js', `specs${es === 'ES5' ? '.es5' : ''}.js`),
    scriptPipeline(es),
    es === 'ESNext' ? stylePipeline('specs.css') : discardStyles(),
    minify(false)
  )
}

function jasmine() {
  return merge(
    file('./spec/jasmine.js', `jasmine.js`),
    scriptPipeline('ES5'),
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
