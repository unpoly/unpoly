function scriptPipeline(target) {
  let erbLoader = {
    loader: 'rails-erb-loader',
    options: {
      runner: 'ruby',
      engine: 'erb'
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
        module: "ESNext",
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

function file(srcPath, outputFilename) {
  return {
    entry: srcPath,
    output: {
      path: __dirname + '/dist',
      // publicPath: '/',
      filename: outputFilename,
    },
    devServer: {
      contentBase: './dist'
    }
  }
}


let es5Pipeline = scriptPipeline('ES5')

let esNextPipeline = scriptPipeline('ESNext')



module.exports = {
  entry: './lib/assets/javascripts/unpoly.js',
  output: {
    path: __dirname + '/dist',
    // publicPath: '/',
    filename: 'unpoly.js'
  },
  devServer: {
    contentBase: './dist'
  },
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
  // plugins: [new BundleAnalyzerPlugin()]
};
