// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
// // import BundleAnalyzerPlugin from 'webpack-bundle-analyzer'

module.exports = {
  devServer: {
    proxy: 'http://localhost:5000',
    host: 'localhost' // sockjs calls fail if my IP changes which is really really annoying in the browsers network tab ;)
  }
  //   configureWebpack: {
  //     plugins: [
  //       new BundleAnalyzerPlugin()
  //     ]
  //   }
}
