const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

function minify(doMinify) {
  return { mode: doMinify ? 'production' : 'none' }
}

function file(srcPath, outputFilename) {
  let entryName = path.parse(outputFilename).name

  return {
    entry: {
      [entryName]: srcPath
    },
    output: {
      path: __dirname + '/../dist',
      // publicPath: '/',
      filename: outputFilename,
    },
    devServer: {
      contentBase: './dist'
    }
  }
}

function scriptPipeline(target, options = {}) {
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
        // module: "ESNext",
        target: target
      }

    }
  }

  let coffeeLoader = {
    loader: 'coffee-loader'
  }

  return {
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
    }
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

stylePipeline = function() {
  return {
    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // all options are optional
        filename: '[name].css',
        chunkFilename: '[id].css',
        ignoreOrder: false, // Enable to remove warnings about conflicting order
      })
    ],
    module: {
      rules: [
        {
          test: /\.(css|sass|scss)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: false
              },
            },
            'css-loader',
            'sass-loader',
          ],
        },
      ],
    },
  }
}

module.exports = { merge, file, scriptPipeline, stylePipeline, minify }
