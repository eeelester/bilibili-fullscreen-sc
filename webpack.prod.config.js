const { merge } = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const path = require('node:path')


const baseConfig = require('./webpack.base.config')

module.exports = merge(baseConfig, {
  mode: 'production',
  devtool: false,
  entry: {
    contentScripts: './src/content-scripts',
    popup: './src/popup',
    background: './src/background'
  },
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/popup/popup.html'),
      filename: path.resolve(__dirname, 'dist/html/popup.html'),
      chunks: ['popup'],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public"),
          to: path.resolve(__dirname, "dist")
        },
      ],
    }),
    new MiniCssExtractPlugin()
  ],
})
