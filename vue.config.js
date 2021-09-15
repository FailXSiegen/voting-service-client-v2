const path = require('path')
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
    extract: { filename: 'styles.css' }
  },
  chainWebpack: config => {
    config.module
      .rule('fonts')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => {
        options.fallback.options.name = '../../fonts/[name].[ext]'
        return options
      })
    config.plugin('copy')
      .tap(args => {
        args[0].push({
          from: path.resolve(__dirname, 'node_modules/@zoomus/websdk/dist/lib'),
          to: path.resolve(__dirname, 'dist/lib/zoom/lib'),
          toType: 'dir',
          ignore: ['.DS_Store']
        })
        return args
      })
  }
}
