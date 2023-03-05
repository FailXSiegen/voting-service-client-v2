<template>
  <nav
    id="mainNavigation"
    class="navbar navbar-dark fixed-top bg-dark"
  >
    <span class="h5 my-3 d-block text-white">Digitalwahl - Client Version {{ appVersion }}</span>
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navbarCollapse"
      aria-controls="navbarCollapse"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon" />
    </button>
    <div
      id="navbarCollapse"
      class="collapse navbar-collapse bg-dark"
    >
      <div
        v-if="showProfileLink"
        class="mb-5"
      >
        <router-link
          :to="{name: RouteOrganizerProfile}"
          class="btn btn-secondary btn-block py-3 px-0"
        >
          <span class="nav-title">{{ $t('navigation.views.' + RouteOrganizerProfile) }}</span>
          <span
            class="nav-icon bi--2xl bi-person"
            :title="$t('navigation.views.' + RouteOrganizerProfile)"
          />
        </router-link>
      </div>
      <ul class="list-group">
        <li
          v-for="(navigationItemRoute, index) in props.routes"
          :key="index"
          class="navigation-item list-group-item"
        >
          <router-link
            v-if="isRouteAccessible(navigationItemRoute) && passParams"
            :to="{name: navigationItemRoute.name, params}"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{ $t('navigation.views.' + navigationItemRoute.name) }}</span>
            <span
              :class="['nav-icon','bi', 'bi--2xl', navigationItemRoute.meta.bootstrapIcon]"
              :title="$t('navigation.views.' + navigationItemRoute.name) "
            />
          </router-link>
          <router-link
            v-else-if="isRouteAccessible(navigationItemRoute)"
            :to="{name: navigationItemRoute.name}"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{ $t('navigation.views.' + navigationItemRoute.name) }}</span>
            <span
              :class="['nav-icon','bi', 'bi--2xl', navigationItemRoute.meta.bootstrapIcon]"
              :title="$t('navigation.views.' + navigationItemRoute.name) "
            />
          </router-link>
        </li>
      </ul>
    </div>
    <button
      class="logout btn btn-danger py-1 d-flex align-items-center"
      @click="onLogout"
    >
      <i class="mr-md-3 bi bi-x-square bi--2xl" />
      <span class="d-none d-md-block">{{ $t('navigation.logOut') }}</span>
    </button>
  </nav>
</template>

<script setup>
import {RouteOrganizerProfile, RouteMainLogin} from "@/router/routes";
import {inject} from 'vue';
import {logout} from "@/core/auth/login";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {useCore} from "@/core/store/core";
import {useRoute, useRouter} from "vue-router";

// @todo dd possibility to add badges to nav links.

const coreStore = useCore();
const router = useRouter();
const appVersion = inject('appVersion');
const props = defineProps({
  routes: {
    type: Array,
    required: true
  },
  passParams: {
    type: Boolean,
    required: false,
    default: false
  },
  showProfileLink: {
    type: Boolean,
    required: false,
    default: true
  }
});

const params = useRoute().params;

function onLogout() {
  logout()
      .then(() => router.push({name: RouteMainLogin}))
      .then(() => toast(i18n.global.tc('success.logout.organizer'), {type: 'success'}));
}

function isRouteAccessible(route) {
  if (route.meta.requireSuperOrganizerRole) {
    return coreStore.isSuperOrganizer;
  }
  return true;
}

</script>

<style lang="scss" scoped>
.navigation-item {
  .router-link-active {
    .nav-icon, .nav-title {
      color: white;
    }
  }

  :hover {
    .nav-icon, .nav-title {
      color: black;
    }
  }
}
</style>