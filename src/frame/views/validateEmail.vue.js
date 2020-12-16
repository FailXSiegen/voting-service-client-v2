import { localize } from '@/frame/lib/localization-helper'
import { validateHash } from '../api/fetch/validate-hash'
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
      submitFinished: false,
      submitSuccess: false,
      responseText: ''
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    }
  },
  async created () {
    if (this.hash === '') {
      return
    }
    validateHash({ hash: this.hash }).then(async (response) => {
      if (response.success) {
        addSuccessMessage('Erfolg', 'Validierung erfoglreich')
        this.submitSuccess = true
      } else {
        addDangerMessage('Fehler', 'Validierung nicht erfoglreich')
        this.responseText = response.error
      }
      this.submitFinished = true
    }).catch((error) => {
      addDangerMessage('Fehler', 'Beim Absenden der Validierung ist ein Fehler aufgetreten')
      console.error(error)
    })
  }
}
