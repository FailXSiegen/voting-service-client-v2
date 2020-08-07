import JQuery from 'jquery'
import store from '../store'

export function addMessage (type, headline, message, persistent) {
  JQuery('.toast:not([data-autohide="false"])').remove()
  store.state.alerts.push({ type, headline, message, persistent })
  setTimeout(() => {
    JQuery('.toast').toast('show')
    JQuery('.toast').on('hidden.bs.toast', function () {
      const index = parseInt(JQuery(this).data('index'))
      store.state.alerts.splice(index, 1)
    })
  }, 100)
}

export function addSuccessMessage (headline, message, persistent = false) {
  addMessage('success', headline, message, persistent)
}
export function addDangerMessage (headline, message, persistent = false) {
  addMessage('danger', headline, message, persistent)
}
export function addWarnMessage (headline, message, persistent = false) {
  addMessage('warning', headline, message, persistent)
}
export function addInfoMessage (headline, message, persistent = false) {
  addMessage('info', headline, message, persistent)
}
