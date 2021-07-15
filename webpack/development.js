const webpack = require('webpack')
const { merge, file, scriptPipeline, stylePipeline, minify } = require('./shared.js')
// const specDir = __dirname + '../spec'

module.exports = [

  merge(
    file('./lib/assets/javascripts/unpoly.coffee', 'unpoly.js'),
    scriptPipeline('ESNext'),
    stylePipeline('unpoly.css'),
    minify(false),
  ),
  merge(
    file('./lib/assets/javascripts/unpoly.coffee', 'unpoly.es5.js'),
    scriptPipeline('ES5'),
    discardStyles(),
    minify(false)
  ),
  merge(
    file('./lib/assets/javascripts/unpoly-migrate.coffee', 'unpoly-migrate.js'),
    scriptPipeline('ES5'),
    minify(false),
  ),
  merge(
    file('./spec/specs.js', 'specs.js'),
    scriptPipeline('ESNext'),
    stylePipeline('specs.css'),
    minify(false)
  ),
  merge(
    file('./spec/specs.js', 'specs.es5.js'), // specs defines classes and ES5 prototypes cannot extend native classes!
    scriptPipeline('ES5'),
    discardStyles(),
    minify(false)
  ),
  merge(
    file('./spec/jasmine.js', 'jasmine.js'),
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
]
