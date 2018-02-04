const path = require('path');
module.exports = {
  entry: './client/client.js',
  output: {
    path: path.resolve('static'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, loaders: ['style', 'css'] },
    ]
  }
}