<template>
  <div id="app">
    <router-view>
      <div slot="alerts" class="toast-container">
        <div :data-index="index" v-for="(alert, index) in alerts" :key="index" class="toast float-right" role="alert" aria-live="assertive" aria-atomic="true" :data-autohide="alert.persistent ? 'false' : 'true'" data-delay="3500">
          <div class="toast-header" :class="`bg-${alert.type}`">
            <strong class="mr-auto">{{ alert.headline }}</strong>
            <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="toast-body">
            {{ alert.message }}
          </div>
        </div>
      </div>
    </router-view>
  </div>
</template>

<script>
export default {
  data () {
    return {
      alerts: this.$store.state.alerts
    }
  }
}
</script>

<style scoped>
  .toast-container {
    position: fixed;
    width: 100%;
    max-width: 300px;
    right: 0;
    top: 20%;
    z-index: 200;
  }
  .toast {
    position: relative;
    right: 0;
    top: 0;
    width: 100%;

  }
  .toast-header {
    color: white;
  }
  .close {
    color: white;
  }
</style>
