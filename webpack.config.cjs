const path = require('path');

module.exports = {
  entry: './src/index.js',  // Đổi đường dẫn này nếu entry point của bạn khác
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,  // Hoặc .ts nếu bạn dùng TypeScript
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  mode: 'development',  // Thay đổi sang 'production' khi deploy
};
