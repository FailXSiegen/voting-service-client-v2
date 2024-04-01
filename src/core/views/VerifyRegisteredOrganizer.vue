<template>
  <CorePageLayout :meta-title="$t('view.register.headline')">
    <div class="verify-registered-organizer">
      <div class="align-items-center justify-content-center">
        <div class="verify-registered-organizer-wrapper text-center m-auto">
          <h1 class="register-organizer-headline">
            {{ $t("view.register.headline") }}
          </h1>
          <AlertBox v-if="requestFinished && !requestFailed">
            <b>{{ $t("view.register.verify.success") }}</b><br />
            {{ $t("view.register.verify.successDescription") }}
          </AlertBox>
          <AlertBox v-else-if="requestFailed" type="danger">
            <b>{{ $t("view.register.verify.failed") }}</b>
          </AlertBox>
          <AlertBox v-else type="info">
            <b>{{ $t("view.register.verify.processing") }}</b><br />
            {{ $t("view.register.verify.processingDescription") }}
          </AlertBox>
        </div>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
import { validateHash } from "@/modules/organizer/requests/validate-hash";
import { onMounted, ref } from "vue";
import { handleError } from "@/core/error/error-handler";
import { useRoute } from "vue-router";
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
  validateHash(hash)
    .then((response) => {
      console.log(response);
      if (response.alreadyConfirmed) {
        requestFinished.value = false;
        requestFailed.value = false;
      } else {
        requestFinished.value = true;
      }
    })
    .catch((error) => {
      console.log(error);
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
