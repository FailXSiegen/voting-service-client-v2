<template>
  <div :id="eventSlug">
    <slot name="alerts"></slot>
    <component
      v-if="allowToRender && userRole != 'organizer'"
      :eventRecord="eventRecord"
      v-bind:is="component"
      @logout="onLogout"
      @changeComponent="changeComponent"
    />
    <div
      class="container alert alert-info text-center mt-5 h3"
      v-if="userRole === 'organizer'"
    >
      <p>{{ localize('view.login.asOrganizerLoggedIn') }}</p>
    </div>
  </div>
</template>

<script>
export { default } from '@/user/views/event.vue.js'
</script>

<style scoped>
.toast-container {
  top: 10%;
  bottom: auto;
}
</style>
