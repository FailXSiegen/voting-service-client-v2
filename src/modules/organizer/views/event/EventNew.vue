<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventsNew')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerEventsNew') }}
      </div>
    </template>
    <template #header>
      <EventNavigation :routes="routes" />
    </template>
    <template #content>
      <EventForm
        :prefill-data="null"
        @submit="onSubmit"
      />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import EventNavigation from '@/modules/organizer/components/EventNavigation.vue';
import EventForm from '@/modules/organizer/components/events/EventForm.vue';
import {RouteOrganizerEvents} from "@/router/routes";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import {useCore} from "@/core/store/core";
import {useRouter} from "vue-router";
import {useMutation} from "@vue/apollo-composable";
import {CREATE_EVENT} from "@/modules/organizer/graphql/mutation/create-event";

const coreStore = useCore();
const router = useRouter();

async function onSubmit(formData) {
  // Create new Events.
  const {mutate: createEvent} = useMutation(CREATE_EVENT, {
    variables: {
      input: {
        organizerId: coreStore.getOrganizer?.id,
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        scheduledDatetime: formData.scheduledDatetime,
        lobbyOpen: formData.lobbyOpen,
        active: formData.active,
        multivoteType: formData.multivoteType,
        videoConferenceConfig: formData.videoConferenceConfig,
      },
    },
  });
  await createEvent();

  // Refetch organizer record.
  coreStore.queryOrganizer();

  // Back to list.
  await router.push({name: RouteOrganizerEvents});

  // Show success message.
  toast(i18n.global.tc('success.organizer.events.createdSuccessfully'), {type: 'success'});
}
</script>

<style lang="scss" scoped>
.events-new {
  max-width: 840px;
}
</style>