<template>
  <div class="profil-container">
    <div class="row" style="min-height: 100vh;">
      <div class="col-3 bg-dark text-white py-3">
        <app-navigation></app-navigation>
      </div>
      <div class="col-9 py-3">
        <h1>{{ headline }}</h1>
        <p>profileoverview</p>
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from './../components/Navigation'

export default {
  components: {
    AppNavigation
  },
  data () {
    return {
      headline: 'Profil'
    }
  }
}
</script>
