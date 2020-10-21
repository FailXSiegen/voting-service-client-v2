<template>
  <div :id="eventSlug">
    <slot name="alerts"></slot>
    <component v-if="allowToRender"
               :eventRecord="eventRecord"
               v-bind:is="component"
               @logout="onLogout"
               @changeComponent="changeComponent" />
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
