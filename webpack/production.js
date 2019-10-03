let { file, scriptPipeline, minify } = require('./shared.js')

module.exports = [
  { ...file('./lib/assets/javascripts/unpoly.js', 'unpoly.es5.js'),
    ...scriptPipeline('ES5'),
    ...minify(false),
  },
  { ...file('./lib/assets/javascripts/unpoly.js', 'unpoly.esnext.js'),
    ...scriptPipeline('ESNext'),
    ...minify(false),
  },
  { ...file('./lib/assets/javascripts/unpoly.js', 'unpoly.es5.min.js'),
    ...scriptPipeline('ES5'),
    ...minify(true),
  },
  { ...file('./lib/assets/javascripts/unpoly.js', 'unpoly.esnext.min.js'),
    ...scriptPipeline('ESNext'),
    ...minify(true),
  },
]
