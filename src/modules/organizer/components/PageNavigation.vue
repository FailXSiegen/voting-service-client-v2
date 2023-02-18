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
      <div class="mb-5">
        <router-link
          to="/admin/profile"
          class="btn btn-primary btn-block py-3 px-0"
        >
          <span class="nav-title">{{ $t('navigation.myProfile') }}</span>
          <span
            class="nav-icon bi--2xl bi-person"
            :title="$t('navigation.myProfile')"
          />
        </router-link>
      </div>
      <ul class="list-group">
        <li
          v-for="(route, index) in props.routes"
          :key="index"
          class="navigation-item list-group-item"
        >
          <!-- @todo respect super admin routes! -->
          <router-link
            :to="route.path"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{ $t('navigation.views.' + route.name) }}</span>
            <span
              class="nav-icon bi--2xl"
              :class="route.meta.bootstrapIcon"
              :title="$t('navigation.views.' + route.name) "
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
import {inject} from 'vue';
import {logout} from "@/core/auth/login";
import {toast} from "vue3-toastify";
import {useI18n} from "vue-i18n";

const appVersion = inject('appVersion');
const props = defineProps({
  routes: {
    type: Array,
    required: true
  }
});
const {t} = useI18n({});

function onLogout() {
  logout().then(() => toast(t('success.logout.organizer'), {type: 'success'}));
}
</script>

<style lang="scss" scoped>
.navigation-item {
  .router-link-active {
    .nav-icon {
      color: white;
    }
  }

  :hover {
    .nav-icon {
      color: black;
    }
  }
}
</style>