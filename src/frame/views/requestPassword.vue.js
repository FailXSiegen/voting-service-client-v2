import { localize } from '@/frame/lib/localization-helper'
import { forgotPassword } from '../api/fetch/password-forgot'
import { addSuccessMessage, addDangerMessage } from '@/frame/lib/alert-helper'
import AppFooter from '@/frame/components/Footer'

export default {
  components: {
    AppFooter
  },
  data () {
    return {
      username: '',
      submitSuccess: false
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    requestForgotPasswordLink () {
      forgotPassword({ username: this.username }).then(async (response) => {
        if (response.success) {
          addSuccessMessage('Erfolg', 'Passwort vergessen Link erfoglreich versendet')
          this.submitSuccess = true
        } else {
          addDangerMessage('Fehler', 'Passwort vergessen Link nicht erfoglreich versendet')
          this.responseText = response.error
        }
        this.submitFinished = true
      }).catch((error) => {
        addDangerMessage('Fehler', 'Beim Absenden ist ein Fehler aufgetreten')
        console.error(error)
      })
    }
  },
  async created () {
    document.title = 'Passwort vergessen - digitalwahl.org'
  }
}
