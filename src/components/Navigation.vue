<template>
  <nav id="mainNavigation">
    <div class="mb-5">
      <router-link to="/admin/profile" class="btn btn-primary btn-block py-3">
        {{ localize('navigation.myProfile') }}
      </router-link>
    </div>
    <div class="list-group">
      <router-link v-for="(view, index) in views" :key="index" :to="view.route"
                   class="list-group-item list-group-item-action list-group-item-dark mb-3 rounded">
        {{ view.title }}
      </router-link>
    </div>
    <div class="mt-5">
      <button @click="onLogout" class="logout btn btn-danger py-3 d-flex align-items-center">
        <i class="mr-3 bi bi-x-square bi--2xl"></i> {{ localize('navigation.logOut') }}
      </button>
    </div>
  </nav>
</template>

<script>
import { localize } from '@/helper/localization-helper'
import { onLogout as apolloOnLogout } from '@/vue-apollo.js'

export default {
  data () {
    return {
      views: this.$store.state.views
    }
  },
  methods: {
    async onLogout () {
      await apolloOnLogout(this.$apollo.provider.defaultClient)
      this.$router.push('/').catch(() => {})
    },
    localize (path) {
      return localize(path)
    }
  }
}
</script>

<style scoped>

.logout {
  width: 100%;
}
#mainNavigation {
  min-height: 100vh;
}
@media screen AND (min-width: 991px) {
  .logout {
    position: fixed;
    bottom: 1.5rem;
    left: 1.5rem;
    width: auto;
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
