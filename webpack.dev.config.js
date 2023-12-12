const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('./webpack.base.config')

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: 'eval-cheap-source-map',
  entry:  './dev/index.tsx',
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: [
          'style-loader',
          'css-loader',
          'less-loader',
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './dev/index.html'
    })
  ],
  devServer: {
    port: 8080,
    compress: true,
    hot: true,
    open: true,
    watchFiles: ['dev/**','src/**'],
  },
})
