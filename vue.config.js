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
  }
}
