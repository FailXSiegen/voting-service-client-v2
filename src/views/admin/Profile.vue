<template>
  <div class="profile-container container-fluid">
    <div class="row">
      <div class="col-12 col-md-3 bg-dark text-white py-3 order-2 order-lg-1">
        <app-navigation />
      </div>
      <div class="col-12 col-md-5 py-3 order-2 order-lg-1">
        <h1>{{ headline }}</h1>
        <p>{{ username }}</p>
        <app-form />
      </div>
    </div>
  </div>
</template>

<script>
import AppNavigation from '@/components/Navigation'
import AppForm from '@/components/profile/Form'

export default {
  components: {
    AppNavigation,
    AppForm
  },
  data () {
    return {
      headline: 'My Profil',
      username: 'Testuser1337'
    }
  }
}
</script>
