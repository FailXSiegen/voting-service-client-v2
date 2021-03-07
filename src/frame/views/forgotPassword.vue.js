import { localize } from '@/frame/lib/localization-helper'
import { validateHash } from '../api/fetch/validate-hash'
import { updateOrganizerPassword } from '../api/fetch/update-organizer-password'
import { addSuccessMessage, addDangerMessage } from '@/frame/lib/alert-helper'
import AppFooter from '@/frame/components/Footer'

export default {
  components: {
    AppFooter
  },
  props: {
    hash: {
      type: String
    }
  },
  data () {
    return {
      submitData: {
        newPassword: '',
        repeatPassword: ''
      },
      organizer: {},
      updateOrganizer: {
        id: 0,
        password: ''
      },
      submitSuccess: false,
      saveSuccess: false,
      responseText: ''
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    async submitUpdateOrganizer (data) {
      const newPasswordField = document.getElementById('newPassword')
      const repeatPasswordField = document.getElementById('repeatPassword')
      if (data.newPassword !== data.repeatPassword) {
        newPasswordField.classList.add('is-invalid')
        repeatPasswordField.classList.add('is-invalid')
      } else {
        this.updateOrganizer.password = data.newPassword
        this.updateOrganizer.id = this.organizer.id
        await updateOrganizerPassword(this.updateOrganizer).then(async (response) => {
          if (response.success) {
            addSuccessMessage('Erfolg', 'Passwort ändern erfoglreich')
            this.saveSuccess = true
          } else {
            addDangerMessage('Fehler', 'Passwort ändern war nicht erfolgreich')
            this.responseText = response.error
          }
          this.submitFinished = true
        }).catch((error) => {
          addDangerMessage('Fehler', 'Beim Absenden des Passwort ändern ist ein Fehler aufgetreten')
          console.error(error)
        })
      }
    }
  },
  async created () {
    if (this.hash === '') {
      return
    }
    await validateHash({ hash: this.hash }).then(async (response) => {
      if (response.success) {
        this.organizer = response.organizer
        this.submitSuccess = true
      } else {
        addDangerMessage('Fehler', 'Link ist ungültig')
        this.responseText = response.error
      }
      this.submitFinished = true
    }).catch((error) => {
      addDangerMessage('Fehler', 'Beim Absenden der Validierung ist ein Fehler aufgetreten')
      console.error(error)
    })
  }
}
