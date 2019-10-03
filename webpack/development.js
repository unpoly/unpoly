let { file, scriptPipeline, minify } = require('./shared.js')

module.exports = [
  { ...file('./lib/assets/javascripts/unpoly.js', 'unpoly.development.es5.js'),
    ...scriptPipeline('ES5'),
    ...minify(false),
  },
  { ...file('./lib/assets/javascripts/unpoly.js', 'unpoly.development.esnext.js'),
    ...scriptPipeline('ESNext'),
    ...minify(false),
  },
]
