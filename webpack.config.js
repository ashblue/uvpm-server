const path = require('path');
const nodeExternals = require('webpack-node-externals');

const config = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  target: 'node',

  externals: [
    nodeExternals()
  ],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        enforce: 'pre',
        loader: 'tslint-loader'
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },

  resolve: {
    extensions: [
      '.tsx',
      '.ts',
      '.js'
    ]
  },

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};

module.exports = config;
