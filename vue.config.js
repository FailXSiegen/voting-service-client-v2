const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'scss',
      patterns: []
    },
    apollo: {
      lintGQL: false
    }
  },
  css: {
    extract: { filename: 'style.[name].css' }
  },
  configureWebpack: {
    performance: {
      hints: false
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'node_modules/@zoomus/websdk/dist/lib'),
            to: path.resolve(__dirname, 'dist/lib/zoom/lib')
          }
        ]
      })
    ]
  }
}
