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
        options.fallback.options.name = '../../fonts/[name].[hash:8].[ext]'
        return options
      })
  }
}
