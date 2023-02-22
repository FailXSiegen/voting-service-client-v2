<template>
  <CorePageLayout>
    <div class="verify-registered-organizer">
      <div class="align-items-center justify-content-center">
        <div class="verify-registered-organizer-wrapper text-center m-auto">
          <h1 class="register-organizer-headline">
            {{ $t('view.register.headline') }}
          </h1>
          <AlertBox v-if="requestFinished && !requestFailed">
            {{ $t('view.register.verify.success') }}
          </AlertBox>
          <AlertBox
            v-else-if="requestFailed"
            type="danger"
          >
            {{ $t('view.register.verify.failed') }}
          </AlertBox>
          <AlertBox
            v-else
            type="info"
          >
            {{ $t('view.register.verify.processing') }}
          </AlertBox>
        </div>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from '@/core/components/CorePageLayout.vue';
import {validateHash} from "@/modules/organizer/requests/validate-hash";
import {onMounted, ref} from "vue";
import {handleError} from "@/core/error/error-handler";
import {useRoute} from "vue-router";
import AlertBox from "@/core/components/AlertBox.vue";

// Access the hash of the url.
const route = useRoute();
const hash = route.params?.hash ?? null;
if (!hash) {
  throw new Error("Missing required parameter hash!");
}

const requestFinished = ref(false);
const requestFailed = ref(false);

onMounted(() => {
  validateHash(hash).then((response) => {
    console.log(response);
    requestFinished.value = true;
  }).catch((error) => {
    requestFailed.value = true;
    handleError(error);
  });
});
</script>

<style lang="scss" scoped>
.verify-registered-organizer-wrapper {
  max-width: 760px;
}
</style>