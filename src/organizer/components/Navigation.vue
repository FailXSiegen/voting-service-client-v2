<template>
  <nav id="mainNavigation" class="navbar navbar-dark fixed-top bg-dark">
    <span class="h5 my-3 d-block text-white">Digitalwahl</span>
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navbarCollapse"
      aria-controls="navbarCollapse"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse bg-dark" id="navbarCollapse">
      <div class="mb-5">
        <router-link
          to="/admin/profile"
          class="btn btn-primary btn-block py-3 px-0"
        >
          <span class="nav-title">{{ localize('navigation.myProfile') }}</span>
          <span
            class="nav-icon bi--2xl bi-person"
            :title="localize('navigation.myProfile')"
          ></span>
        </router-link>
      </div>
      <ul class="list-group">
        <li class="list-group-item" v-for="(view, index) in views" :key="index">
          <router-link
            v-if="(view.superAdmin && organizer.superAdmin) || !view.superAdmin"
            :to="view.route"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{ view.title }}</span>
            <span
              class="nav-icon bi--2xl"
              :class="view.icon"
              :title="view.title"
            ></span>
          </router-link>
        </li>
      </ul>
    </div>
    <button
      @click="onLogout"
      class="logout btn btn-danger py-1 d-flex align-items-center"
    >
      <i class="mr-3 bi bi-x-square bi--2xl"></i>
      {{ localize('navigation.logOut') }}
    </button>
  </nav>
</template>

<script>
import { localize } from '@/frame/lib/localization-helper'
import { onLogout as apolloOnLogout } from '@/vue-apollo'
import { ORGANIZER } from '@/organizer/api/graphql/gql/queries'

export default {
  data () {
    return {
      views: this.$store.state.views,
      organizer: {}
    }
  },
  apollo: {
    organizer: {
      query: ORGANIZER,
      variables () {
        return {
          organizerId: this.$store.state.currentUser.id
        }
      }
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
