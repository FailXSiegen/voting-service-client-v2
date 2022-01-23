<template>
  <div class="iframe-container"></div>
</template>

<script>
export default {
  data () {
    return {
      src: '',
      meetConfig: {},
      signature: {},
      ZoomMtg: null
    }
  },
  props: {
    apiKey: String,
    apiSecret: String,
    nickname: String,
    meetingId: String,
    password: String,
    returnUrl: String
  },
  async mounted () {
    const { ZoomMtg } = await import('@zoomus/websdk')
    this.ZoomMtg = ZoomMtg
    document.getElementById('zmmtg-root').style.display = 'block'
    // CDN version default
    ZoomMtg.setZoomJSLib(
      '/lib/zoom/lib',
      '/av' // @todo move to public folder on build! node_modules/@zoomus/websdk/dist/lib/av
    )
    ZoomMtg.preLoadWasm()
    ZoomMtg.prepareJssdk()
    // loads language files, also passes any error messages to the ui
    ZoomMtg.i18n.load('de-DE')
    ZoomMtg.i18n.reload('de-DE')

    const me = this
    // Meeting config object
    this.meetConfig = {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      meetingNumber: this.meetingId,
      userName: this.nickname,
      passWord: this.password,
      leaveUrl: this.returnUrl,
      role: 0,
      lang: 'de-DE',
      china: false,
      userEmail: ''
    }
    me.setCookie('meeting_number', me.meetingId)
    me.setCookie('meeting_pwd', me.password)

    // Generate Signature function
    this.signature = ZoomMtg.generateSignature({
      meetingNumber: me.meetConfig.meetingNumber,
      apiKey: me.meetConfig.apiKey,
      apiSecret: me.meetConfig.apiSecret,
      role: me.meetConfig.role,
      success: function (res) {
        me.join(me, res)
      }
    })
  },
  methods: {
    setCookie (cname, cvalue) {
      const exdays = 1
      const d = new Date()
      d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
      const expires = 'expires=' + d.toUTCString()
      document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
    },
    join (me, res) {
      me.meetConfig.signature = res.result
      // join function
      me.ZoomMtg.init({
        leaveUrl: me.meetConfig.leaveUrl,
        webEndpoint: me.meetConfig.webEndpoint,
        success: () => {
          me.ZoomMtg.i18n.load(me.meetConfig.lang)
          me.ZoomMtg.i18n.reload(me.meetConfig.lang)
          // eslint-disable-next-line
          me.ZoomMtg.join({
            meetingNumber: me.meetConfig.meetingNumber,
            userName: me.meetConfig.userName,
            signature: me.meetConfig.signature,
            apiKey: me.meetConfig.apiKey,
            userEmail: me.meetConfig.userEmail,
            passWord: me.meetConfig.passWord,
            success: function (res) {
              me.ZoomMtg.getAttendeeslist({})
              me.ZoomMtg.getCurrentUser({
                success: function (res) {
                  // eslint-disable-next-line
                  console.log('success getCurrentUser', res.result.currentUser)
                }
              })
            },
            error: function (res) {
              // eslint-disable-next-line
              console.log('failed to connect a:')
              // eslint-disable-next-line
              console.log(res)
            }
          })
        },
        error: function (res) {
          // eslint-disable-next-line
          console.log('failed to connect b:')
          // eslint-disable-next-line
          console.log(res)
        }
      })
    }
  }
}
</script>

<style>
#zmmtg-root {
  display: none;
}
</style>
