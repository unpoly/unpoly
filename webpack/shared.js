const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

function minify(doMinify) {
  return { mode: doMinify ? 'production' : 'none' }
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

let extractCssLoader = {
  loader: MiniCssExtractPlugin.loader,
  options: {
    hmr: false
  }
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

module.exports = { merge, file, scriptPipeline, stylePipeline, discardStyles, minify }
