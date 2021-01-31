import { localize } from '@/frame/lib/localization-helper'
import { addSuccessMessage, addDangerMessage } from '@/frame/lib/alert-helper'
import { createOrganizer } from '@/frame/api/fetch/create'
import AppFooter from '@/frame/components/Footer'

export default {
  components: {
    AppFooter
  },
  data () {
    return {
      submitData: {
        username: '',
        email: '',
        password: '',
        repeatPassword: '',
        publicName: ''
      },
      submitSuccess: false
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    onRegisterOrganizer (data) {
      const usernameField = document.getElementById('username')
      const passwordField = document.getElementById('password')
      const repeatPasswordField = document.getElementById('repeat-password')
      if (data.password !== data.repeatPassword) {
        addDangerMessage('Fehler', 'Passwörter stimmen nicht überein')
        passwordField.classList.add('is-invalid')
        repeatPasswordField.classList.add('is-invalid')
      } else {
        usernameField.classList.remove('is-invalid')
        passwordField.classList.remove('is-invalid')
        repeatPasswordField.classList.remove('is-invalid')
        delete data.repeatPassword
        createOrganizer(data).then(async (response) => {
          if (response.success) {
            addSuccessMessage('Erfolg', 'Anmeldung erfolgreich abgesendet. Bitte überprüfen Sie Ihren Posteingang zur Bestätigung Ihrer E-Mail Adresse.')
            this.submitSuccess = true
          } else {
            usernameField.classList.add('is-invalid')
            addDangerMessage('Fehler', 'Anmeldung nicht erfolgreich abgesendet <br />' + response.error)
          }
        }).catch((error) => {
          addDangerMessage('Fehler', 'Anmeldung nicht erfolgreich abgesendet')
          console.error(error)
        })
      }
    }
  }
}
