<template>
  <PageLayout :meta-title="$t('navigation.views.organizerPolls')">
    <template #title>
      <div class="events-new-title">
        {{ $t('navigation.views.organizerPolls') }}
        <router-link
          :to="{name: RouteOrganizerDashboard}"
          class="btn btn-secondary mb-3 float-right d-none d-md-inline-block"
        >
          <i class="bi-arrow-left bi--1xl mr-1" />
          <span class="align-middle">
            {{ $t('navigation.backToDashboard') }}
          </span>
        </router-link>
      </div>
    </template>
    <template #header>
      <PageNavigation
        :routes="routes"
        :pass-params="true"
        :show-profile-link="false"
      />
    </template>
    <template #content>
      PollListing.vue
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/modules/organizer/components/PageLayout.vue';
import PageNavigation from '@/modules/organizer/components/PageNavigation.vue';
import {
  getRoutesByName,
  RouteOrganizerDashboard,
  RouteOrganizerLobbyRoom,
  RouteOrganizerMemberRoom,
  RouteOrganizerPollResults,
  RouteOrganizerPolls,
} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {useRoute, useRouter} from "vue-router";
import {useQuery} from "@vue/apollo-composable";
import {EVENT} from "@/modules/organizer/graphql/queries/event";
import {handleError} from "@/core/error/error-handler";
import {NetworkError} from "@/core/error/NetworkError";
import {ref} from "vue";

// Define navigation items.
const routes = getRoutesByName([
  RouteOrganizerMemberRoom,
  RouteOrganizerLobbyRoom,
  RouteOrganizerPolls,
  RouteOrganizerPollResults,
]);

const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const event = ref(null);

// Try to fetch event by id and organizer id.
const eventQuery = useQuery(EVENT, {id, organizerId: coreStore.user.id}, {fetchPolicy: "no-cache"});
eventQuery.onResult(({data}) => {
  // check if the event could be fetched successfully. redirect to list if not.
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({name: RouteOrganizerDashboard});
    return;
  }
  event.value = data?.event;
  loaded.value = true;
});
</script>
