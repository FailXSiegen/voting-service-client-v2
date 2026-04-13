<template>
  <PageLayout :meta-title="$t('navigation.views.organizerVideoConferenceNew')">
    <template #title>
      {{ $t('navigation.views.organizerVideoConferenceNew') }}
      <router-link
        :to="{ name: RouteOrganizerVideoConference }"
        class="btn btn-secondary mb-3 mt-2 float-end d-none d-md-inline-block"
      >
        <i class="bi-arrow-left bi--1xl me-1" />
        <span class="align-middle">
          {{ $t('view.videoConference.backToListView') }}
        </span>
      </router-link>
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <form class="video-conference-new" @submit.prevent="onSubmit">
        <div class="mb-3">
          <label class="form-label">{{ $t('view.videoConference.formData.providerType') }}</label>
          <select v-model="providerType" class="form-select">
            <option value="zoom">Zoom</option>
            <option value="jitsi">Jitsi</option>
          </select>
        </div>
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
        <template v-if="providerType === 'zoom'">
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
        </template>
        <template v-else>
          <div class="mb-3">
            <BaseInput
              :label="$t('view.videoConference.formData.serverUrl')"
              :errors="v$.serverUrl?.$errors"
              :has-errors="v$.serverUrl?.$errors.length > 0"
              :value="formData.serverUrl"
              @change="
                ({ value }) => {
                  formData.serverUrl = value;
                }
              "
            />
          </div>
        </template>
        <button type="submit" class="btn btn-primary">
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
  RouteOrganizerVideoConference,
} from '@/router/routes';
import { computed, reactive, ref } from 'vue';
import { required, requiredIf } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import BaseInput from '@/core/components/form/BaseInput.vue';
import { handleError } from '@/core/error/error-handler';
import { InvalidFormError } from '@/core/error/InvalidFormError';
import { useMutation } from '@vue/apollo-composable';
import { CREATE_ZOOM_MEETING } from '@/modules/organizer/graphql/mutation/create-zoom-meeting';
import { CREATE_JITSI_MEETING } from '@/modules/organizer/graphql/mutation/create-jitsi-meeting';
import { toast } from 'vue3-toastify';
import t from '@/core/util/l18n';
import { useCore } from '@/core/store/core';
import { useRouter } from 'vue-router';

const coreStore = useCore();
const router = useRouter();
const providerType = ref('zoom');

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
  title: '',
  sdkKey: '',
  sdkSecret: '',
  serverUrl: '',
});
const rules = computed(() => {
  return {
    title: { required },
    sdkKey: { requiredIf: requiredIf(() => providerType.value === 'zoom') },
    sdkSecret: { requiredIf: requiredIf(() => providerType.value === 'zoom') },
    serverUrl: { requiredIf: requiredIf(() => providerType.value === 'jitsi') },
  };
});

const v$ = useVuelidate(rules, formData);

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  if (providerType.value === 'zoom') {
    const { mutate: createZoomMeeting } = useMutation(CREATE_ZOOM_MEETING, {
      variables: {
        input: {
          organizerId: coreStore.getOrganizer?.id,
          title: formData.title,
          sdkKey: formData.sdkKey,
          sdkSecret: formData.sdkSecret,
        },
      },
    });
    await createZoomMeeting();
  } else {
    const { mutate: createJitsiMeeting } = useMutation(CREATE_JITSI_MEETING, {
      variables: {
        input: {
          organizerId: coreStore.getOrganizer?.id,
          title: formData.title,
          serverUrl: formData.serverUrl,
        },
      },
    });
    await createJitsiMeeting();
  }

  // Re-fetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  await router.push({ name: RouteOrganizerVideoConference });

  // Show success message.
  toast(t('success.organizer.videoConference.createdSuccessfully'), {
    type: 'success',
  });
}
</script>

<style lang="scss" scoped>
.video-conference-new {
  max-width: 640px;
}
</style>
