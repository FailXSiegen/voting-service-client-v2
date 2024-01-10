<template>
  <footer class="fixed-bottom page-footer font-small border-top bg-white pb-2">
    <nav class="d-flex justify-content-center text-center">
      <ul class="nav navbar-nav flex-row">
        <li class="nav-item m-1">
          <router-link :to="{ name: RouteMainLogin }" class="nav-link p-1">
            {{ $t("navigation.views.startPage") }}
          </router-link>
        </li>
        <li
          v-for="routeName in navigationItems"
          :key="routeName"
          class="nav-item m-1"
        >
          <router-link :to="{ name: routeName }" class="nav-link p-1">
            {{ $t("navigation.views.staticPages." + routeName) }}
          </router-link>
        </li>
      </ul>
    </nav>
  </footer>
</template>

<script setup>
import {
  RouteMainLogin,
  RouteStaticDataProtection,
  RouteStaticFaq,
  RouteStaticFunctions,
  RouteStaticImprint,
  RouteStaticManual,
  RouteStaticUserAgreement,
} from "@/router/routes";

const navigationItems = [
  RouteStaticImprint,
  RouteStaticUserAgreement,
  RouteStaticDataProtection,
  RouteStaticFunctions,
  RouteStaticFaq,
  RouteStaticManual,
];
</script>

<style lang="scss" scoped>
.router-link-exact-active {
  background-color: inherit;
}

@media (max-width: 576px) {
  footer {
    position: relative !important;
  }
}
</style>
