<template>
  <div class="card mt-3 p-3">
    <h3 class="mb-4">
      {{ $t('view.login.headline.orgaRegister') }}
    </h3>
    <router-link
      :to="{name: RouteRegisterOrganizer}"
      class="btn btn-secondary btn-block w-100 h-100 mb-3"
    >
      {{ $t('view.login.registerAsOrganizer') }}
    </router-link>
    <span class="w-100 d-inline-block">
      <AlertBox
        type="warning"
        :message="$t('view.login.registerAsOrganizerInfo')"
      />
    </span>
  </div>
</template>

<script setup>
import AlertBox from '@/core/components/AlertBox.vue';
import {RouteRegisterOrganizer} from "@/router/routes";
</script>