<template>
  <PageLayout :meta-title="$t('navigation.views.organizerVideoConferenceEdit')">
    <template #title>
      {{ $t("navigation.views.organizerVideoConferenceEdit") }}
      <router-link
        :to="{ name: RouteOrganizerVideoConference }"
        class="btn btn-secondary mb-3 mt-2 float-end d-none d-md-inline-block"
      >
        <i class="bi-arrow-left bi--1xl me-1" />
        <span class="align-middle">
          {{ $t("view.videoConference.backToListView") }}
        </span>
      </router-link>
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <form
        v-if="loaded"
        class="video-conference-edit"
        @submit.prevent="onSubmit"
      >
        <div class="mb-3">
          <BaseInput
            :label="$t('view.videoConference.formData.title')"
            :errors="v$.title?.$errors"
            :has-errors="v$.title?.$errors.length > 0"
            :value="formData.title"
            @change="
              ({ value }) => {
                formData.title = value;
              }
            "
          />
        </div>
        <div class="mb-3">
          <BaseInput
            :label="$t('view.videoConference.formData.sdkKey')"
            :errors="v$.sdkKey?.$errors"
            :has-errors="v$.sdkKey?.$errors.length > 0"
            :value="formData.sdkKey"
            @change="
              ({ value }) => {
                formData.sdkKey = value;
              }
            "
          />
        </div>
        <div class="mb-3">
          <BaseInput
            :label="$t('view.videoConference.formData.sdkSecret')"
            :errors="v$.sdkSecret?.$errors"
            :has-errors="v$.sdkSecret?.$errors.length > 0"
            :value="formData.sdkSecret"
            @change="
              ({ value }) => {
                formData.sdkSecret = value;
              }
            "
          />
        </div>
        <button type="submit" class="btn btn-primary">
          {{ $t("view.videoConference.formData.submitEdit") }}
        </button>
      </form>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference,
} from "@/router/routes";
import { computed, reactive, ref } from "vue";
import { required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import BaseInput from "@/core/components/form/BaseInput.vue";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { useMutation } from "@vue/apollo-composable";
import { UPDATE_ZOOM_MEETING } from "@/modules/organizer/graphql/mutation/update-zoom-meeting";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { useCore } from "@/core/store/core";
import { useRouter, useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { QUERY_ZOOM_MEETING } from "@/modules/organizer/graphql/queries/zoom-meeting";

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
]);

// Form and validation setup.
const formData = reactive({
  title: "",
  sdkKey: "",
  sdkSecret: "",
});
const rules = computed(() => {
  return {
    title: { required },
    sdkKey: { required },
    sdkSecret: { required },
  };
});

const v$ = useVuelidate(rules, formData);

// Fetch video conference system to edit.
const { onResult } = useQuery(
  QUERY_ZOOM_MEETING,
  { id },
  { fetchPolicy: "no-cache" },
);
onResult(({ data }) => {
  const { title, sdkKey, sdkSecret } = data.zoomMeeting;
  formData.title = title;
  formData.sdkKey = sdkKey;
  formData.sdkSecret = sdkSecret;
  loaded.value = true;
});

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  // Update new zoom meeting.
  const { mutate: updateZoomMeeting } = useMutation(UPDATE_ZOOM_MEETING, {
    variables: {
      input: {
        id,
        title: formData.title,
        sdkKey: formData.sdkKey,
        sdkSecret: formData.sdkSecret,
      },
    },
  });
  await updateZoomMeeting();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  await router.push({ name: RouteOrganizerVideoConference });

  // Show success message.
  toast(t("success.organizer.videoConference.updatedSuccessfully"), {
    type: "success",
  });
}
</script>

<style lang="scss" scoped>
.video-conference-edit {
  max-width: 640px;
}
</style>
