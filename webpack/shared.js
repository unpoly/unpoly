const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

function minify(doMinify) {
  return {
    mode: doMinify ? 'production' : 'none',
    devtool: doMinify ? 'source-map' : false,
    optimization: {
      minimize: doMinify,
      minimizer: [
        new TerserPlugin({
          terserOptions: { // https://github.com/terser/terser#minify-options
            compress: { // https://github.com/terser/terser#compress-options
              passes: 3,
              ecma: 2021,
              keep_classnames: true,
            },
            mangle: {
              keep_classnames: true,
              properties: {
                regex: /^[_#]/
              }
            }
          }
        })
      ]
    }
  }
}

function file(srcPath, output) {
  let parsedOutput = path.parse(output)
  let entryName = parsedOutput.name // foo.js => foo
  let outputFilename = parsedOutput.base
  let outputFolder = parsedOutput.dir || (__dirname + '/../dist')

  return {
    entry: {
      [entryName]: srcPath
    },
    output: {
      path: outputFolder,
      filename: outputFilename,
    },
    devServer: {
      contentBase: './dist',
      writeToDisk: true,
    },
    cache: true
  }
}

function scriptPipeline({ es, lint = true }) {
  if (es === 'modern') {
    es = 'es2021'
  }

  let erbLoader = {
    loader: 'rails-erb-loader',
    options: {
      runner: 'ruby',
      engine: 'erb',
    }
  }

  let tsLoader = {
    loader: 'ts-loader',
    options: {
      appendTsSuffixTo: [/.*/],
      transpileOnly: true,
      compilerOptions: {
        allowJs: true,
        checkJs: true,
        // Emit a source map from the ts-loader output back to the original
        // source, so webpack can chain it and stack traces resolve to real
        // file:line positions (not the transpiled, comment-stripped output).
        sourceMap: true,
        // importHelpers: true,
        // module: "ES2020",
        target: es,
        // The entirety of Unpoly's documentation is embedded in the source files.
        // Even when we're not minifying, we want to remove these massive comments.
        // This reduces the file size of unminified unpoly.js from ~1 MB to ~300 KB, which
        // in turn reduces the size of the npm packages (and Ruby gems) that we publish.
        // It also helps making Unpoly not appear epicly huge in bundle size analyzers.
        removeComments: true
      }

    }
  }

  let plugins = []
  if (lint) {
    plugins.push(
      new ESLintPlugin({
        extensions: ['js', 'ts'],
        // Emit lint problems as compilation errors (so `stats.hasErrors()` is true
        // and one-shot builds still exit non-zero), but never *throw* — a thrown
        // HookWebpackError would kill `webpack --watch`, and the watcher must keep
        // watching so the next edit can fix things.
        failOnError: false,
      })
    )
  }

  return {
    plugins,
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [tsLoader]
        },
        {
          test: /\.js\.erb$/,
          exclude: /node_modules/,
          use: [tsLoader, erbLoader]
        },
      ]
    },
    resolve: {
      extensions: ['.js', '.js.erb']
    },
    target: ['web', es]
  }
}

function merge(...configs) {
  let merged = {
    module: {
      rules: []
    },
    resolve: {
      extensions: []
    },
    plugins: []
  }

  for (let config of configs) {
    if (!config) {
      // Skip null configs
      continue
    }

    // First set all the config keys that never existed in merged
    for (let key in config) {
      if (merged[key] == null) {
        merged[key] = config[key]
      }
    }

    // Now merge all keys with array values
    if (config.module && config.module.rules) {
      merged.module.rules.push(...config.module.rules)
    }
    if (config.resolve && config.resolve.extensions) {
      merged.resolve.extensions.push(...config.resolve.extensions)
    }
    if (config.plugins) {
      merged.plugins.push(...config.plugins)
    }
  }

  return merged
}

let extractCssLoader = {
  loader: MiniCssExtractPlugin.loader,
  options: {}
}

function stylePipeline(filename = "[name.css]") {
  return {
    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename,
        chunkFilename: '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      })
    ],
    module: {
      rules: [
        {
          test: /\.(css)$/,
          use: [extractCssLoader, 'css-loader']
        },
        {
          test: /\.(sass|scss)$/,
          use: [extractCssLoader, 'css-loader', 'sass-loader']
        },
      ],
    },
    resolve: {
      extensions: ['.css', '.sass', '.scss']
    }
  }
}

function discardStyles() {
  return {
    module: {
      rules: [
        {
          test: /\.(css|sass|scss)$/,
          use: 'null-loader'
        },
      ],
    },
    resolve: {
      extensions: ['.css', '.sass', '.scss']
    }
  }
}

// Force separate source maps onto a list of configs.
//
// We only enable source maps for the *development*, *CI* and *test* builds, not
// for the published production build (which would otherwise ship a
// sourceMappingURL comment in the non-minified unpoly.js). Source maps let
// bin/test.mjs translate stack traces from bundle positions (dist/specs.js:11887)
// back to the original source (spec/unpoly/form_spec.js:877) even though we
// don't minify the test build — bundling and the ts-loader alone already shift
// every line number.
function withSourceMaps(configs) {
  return configs.map((config) => ({ ...config, devtool: 'source-map' }))
}

module.exports = {
  merge,
  file,
  scriptPipeline,
  stylePipeline,
  discardStyles,
  minify,
  withSourceMaps
}
