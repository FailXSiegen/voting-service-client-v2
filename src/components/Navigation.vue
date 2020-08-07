<template>
  <nav id="mainNavigation">
    <div class="mb-5">
      <router-link to="/my-profile" class="btn btn-primary btn-block py-3">Mein Profil</router-link>
    </div>
    <div class="list-group">
      <router-link v-for="(view, index) in views" :key="index" :to="view.route" class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ view.title }}
      </router-link>
    </div>
  </nav>
</template>

<script>

export default {
  data () {
    return {
      views: this.$store.state.views
    }
  }
}
</script>
