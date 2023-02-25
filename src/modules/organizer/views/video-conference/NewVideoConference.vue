<template>
  <PageLayout :meta-title="$t('navigation.views.organizerVideoConferenceNew')">
    <template #title>
      {{ $t('navigation.views.organizerVideoConferenceNew') }}
      <router-link
        :to="{name: RouteOrganizerVideoConference}"
        class="btn btn-secondary mb-3 float-right d-none d-md-inline-block"
      >
        <i class="bi-arrow-left bi--1xl mr-1" />
        <span class="align-middle">
          {{ $t('view.videoConference.backToListView') }}
        </span>
      </router-link>
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <form
        class="video-conference-new"
        @submit.prevent="onSubmit"
      >
        <div class="form-group">
          <BaseInput
            :label="$t('view.videoConference.formData.title')"
            :errors="v$.title?.$errors"
            :has-errors="v$.title?.$errors.length > 0"
            :value="formData.title"
            @change="({value}) => {formData.title = value;}"
          />
        </div>
        <div class="form-group">
          <BaseInput
            :label="$t('view.videoConference.formData.apiKey')"
            :errors="v$.apiKey?.$errors"
            :has-errors="v$.apiKey?.$errors.length > 0"
            :value="formData.apiKey"
            @change="({value}) => {formData.apiKey = value;}"
          />
        </div>
        <div class="form-group">
          <BaseInput
            :label="$t('view.videoConference.formData.apiSecret')"
            :errors="v$.apiSecret?.$errors"
            :has-errors="v$.apiSecret?.$errors.length > 0"
            :value="formData.apiSecret"
            @change="({value}) => {formData.apiSecret = value;}"
          />
        </div>
        <button
          type="submit"
          class="btn btn-primary"
        >
          {{ $t('view.videoConference.formData.submitNew') }}
        </button>
      </form>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerVideoConference
} from "@/router/routes";
import {computed, reactive} from "vue";
import {required} from "@vuelidate/validators";
import {useVuelidate} from "@vuelidate/core";
import BaseInput from "@/core/components/form/BaseInput.vue";
import {handleError} from "@/core/error/error-handler";
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {useMutation} from '@vue/apollo-composable';
import {CREATE_ZOOM_MEETING} from "@/modules/organizer/graphql/mutation/create-zoom-meeting";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {useCore} from "@/core/store/core";
import {useRouter} from "vue-router";

const coreStore = useCore();
const router = useRouter();

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents
]);

// Form and validation setup.
const formData = reactive({
  title: '',
  apiKey: '',
  apiSecret: '',
});
const rules = computed(() => {
  return {
    title: {required},
    apiKey: {required},
    apiSecret: {required},
  };
});

const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  // Create new zoom meeting.
  const {mutate: createZoomMeeting} = useMutation(CREATE_ZOOM_MEETING, {
    variables: {
      input: {
        id: coreStore.getOrganizer?.id,
        title: formData.title,
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
      },
    },
  });
  await createZoomMeeting();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  await router.push({name: RouteOrganizerVideoConference});

  // Show success message.
  toast(i18n.global.tc('success.organizer.videoConference.createdSuccessfully'), {type: 'success'});
}
</script>

<style lang="scss" scoped>
.video-conference-new {
  max-width: 640px;
}
</style>