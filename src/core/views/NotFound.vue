<template>
  <CorePageLayout>
    <div class="container-fluid min-vh-100">
      <div class="container">
        <h1 class="d-block text-center mb-5 mt-5">
          {{ $t('error.routing.404Headline') }}
        </h1>
        <div class="d-flex justify-content-center">
          <div class="not-found-wrapper">
            <div class="card">
              <div class="card-body">
                <div class="card-img">
                  <img
                    alt="404"
                    class="img-fluid"
                    src="@/assets/images/404-robot.svg"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from '@/core/components/CorePageLayout.vue';
import LoginFooter from '@/core/components/LoginFooter.vue';
</script>

<style lang="scss" scoped>
.not-found-wrapper {
  max-width: 600px;
  width: 100%;
}
</style>