const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

function minify(doMinify) {
  return {
    mode: doMinify ? 'production' : 'none',
    optimization: {
      minimize: doMinify,
      minimizer: [
        new TerserPlugin({
          terserOptions: { // https://github.com/terser/terser#minify-options
            compress: { // https://github.com/terser/terser#compress-options
              passes: 3,
              ecma: 2021,
            },
            mangle: {
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

  let coffeeLoader = {
    loader: 'coffee-loader'
  }

  let plugins = []
  if (lint) {
    plugins.push(
      new ESLintPlugin({
        extensions: ['js', 'ts']
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
          test: /\.coffee$/,
          exclude: /node_modules/,
          use: [tsLoader, coffeeLoader]
        },
        {
          test: /\.js\.erb$/,
          exclude: /node_modules/,
          use: [tsLoader, erbLoader]
        },
        {
          test: /\.coffee\.erb$/,
          exclude: /node_modules/,
          use: [tsLoader, coffeeLoader, erbLoader]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.coffee', '.js.erb', '.coffee.erb']
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

stylePipeline = function(filename = "[name.css]") {
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

discardStyles = function() {
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

module.exports = {
  merge,
  file,
  scriptPipeline,
  stylePipeline,
  discardStyles,
  minify
}
