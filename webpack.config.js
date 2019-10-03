// var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// console.log("--------------")
// console.log(process.env.NODE_ENV)
// console.log(process.env.WEBPACK_MODE)
// console.log(process.env)
// console.log("--------------")

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
      target: "ESNext"
    }

  }
}

let coffeeLoader = {
  loader: 'coffee-loader'
}


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
