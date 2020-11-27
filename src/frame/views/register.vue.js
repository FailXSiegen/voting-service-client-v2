import { localize } from '@/frame/lib/localization-helper'

export default {
  data () {
    return {
      submitData: {
        userName: '',
        email: '',
        password: '',
        repeatPassword: '',
        publicName: ''
      }
    }
  },
  methods: {
    localize (path) {
      return localize(path)
    },
    onRegisterOrganizer (data) {
      const registerForm = document.getElementById('register-form')
      const passwordField = document.getElementById('password')
      const repeatPasswordField = document.getElementById('repeat-password')

      if (data.password !== data.repeatPassword) {
        console.log(registerForm)
        console.log(passwordField)
        console.log(repeatPasswordField)
        alert("passwords don't match!")
      } else {
        alert('passwords match!')
      }
    }
  }
}
