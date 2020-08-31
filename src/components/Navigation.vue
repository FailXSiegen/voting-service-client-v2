<template>
  <nav id="mainNavigation">
    <div class="mb-5">
      <router-link to="/admin/profile" class="btn btn-primary btn-block py-3">Mein Profil</router-link>
    </div>
    <div class="list-group">
      <router-link v-for="(view, index) in views" :key="index" :to="view.route"
                   class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
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

<style scoped>
@media screen AND (min-width: 991px) {
  #mainNavigation {
    min-height: 100vh;
  }
}

.list-group-item {
  border-color: transparent;
  border-width: 3px;
}

.list-group-item.list-group-item-dark.router-link-exact-active,
.list-group-item.list-group-item-dark:active,
.list-group-item.list-group-item-dark:focus {
  background-color: white;
  border-color: var(--primary);
  border-width: 3px;
}

.list-group-item.list-group-item-dark:hover {
  border-color: transparent;
  background-color: var(--primary);
  color: white;
}

.list-group-item + .list-group-item {
  border-top-width: initial;
}
</style>
