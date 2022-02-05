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
    module: {
      rules: [
        {
          test: /\.(png|jpg|gif)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                encoding: false
              }
            }
          ]
        }
      ]
    },
    watch: true,
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
