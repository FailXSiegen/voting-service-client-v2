export default {
  metaInfo: {
    title: 'digitalwahl.org',
    titleTemplate: '%s - digitalwahl.org',
    htmlAttrs: {
      lang: 'de'
    },
    meta: [
      { name: 'description', content: 'Einfach die Wahl haben.' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ]
  },
  data () {
    return {
      alerts: this.$store.state.alerts
    }
  }
}
