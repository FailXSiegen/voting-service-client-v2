<template>
  <nav id="mainNavigation" class="navbar navbar-dark fixed-top bg-dark">
    <span class="h5 my-3 d-block text-white">Digitalwahl</span>
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarCollapse"
      aria-controls="navbarCollapse"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon" />
    </button>
    <div id="navbarCollapse" class="collapse navbar-collapse bg-dark">
      <ul class="list-group">
        <li class="navigation-item list-group-item">
          <router-link
            :to="{ name: RouteOrganizerMemberRoom, params }"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{
              $t("navigation.views." + RouteOrganizerMemberRoom)
            }}</span>
            <span
              :class="[
                'nav-icon',
                'bi',
                'bi--2xl',
                getRouteByName(RouteOrganizerMemberRoom)?.meta?.bootstrapIcon,
              ]"
              :title="$t('navigation.views.' + RouteOrganizerMemberRoom)"
            />
            <span class="badge text-bg-success badge-pill">
              {{ verifiedUsersCount }}
            </span>
          </router-link>
        </li>
        <li class="navigation-item list-group-item">
          <router-link
            :to="{ name: RouteOrganizerLobbyRoom, params }"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{
              $t("navigation.views." + RouteOrganizerLobbyRoom)
            }}</span>
            <span
              :class="[
                'nav-icon',
                'bi',
                'bi--2xl',
                getRouteByName(RouteOrganizerLobbyRoom)?.meta?.bootstrapIcon,
              ]"
              :title="$t('navigation.views.' + RouteOrganizerLobbyRoom)"
            />
            <span class="badge text-bg-warning badge-pill">
              {{ pendingUsersCount }}
            </span>
          </router-link>
        </li>
        <li class="navigation-item list-group-item">
          <router-link
            :to="{ name: RouteOrganizerPolls, params }"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{
              $t("navigation.views." + RouteOrganizerPolls)
            }}</span>
            <span
              :class="[
                'nav-icon',
                'bi',
                'bi--2xl',
                getRouteByName(RouteOrganizerPolls)?.meta?.bootstrapIcon,
              ]"
              :title="$t('navigation.views.' + RouteOrganizerPolls)"
            />
          </router-link>
        </li>
        <li class="navigation-item list-group-item">
          <router-link
            :to="{ name: RouteOrganizerPollResults, params }"
            class="list-group-item-action btn btn-lg list-group-item-dark d-block w-100 rounded py-3 px-0 text-center"
          >
            <span class="nav-title">{{
              $t("navigation.views." + RouteOrganizerPollResults)
            }}</span>
            <span
              :class="[
                'nav-icon',
                'bi',
                'bi--2xl',
                getRouteByName(RouteOrganizerPollResults)?.meta?.bootstrapIcon,
              ]"
              :title="$t('navigation.views.' + RouteOrganizerPollResults)"
            />
          </router-link>
        </li>
        <li class="list-group-item">
          <router-link
            :to="{ name: RouteOrganizerEvents }"
            class="btn btn-danger w-100 text-center"
          >
            <span class="nav-title">{{ $t("navigation.backToEvents") }}</span>
            <span
              :class="['nav-icon', 'bi', 'bi--2xl', 'bi-arrow-left']"
              :title="$t('navigation.backToEvents')"
            />
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import {
  getRouteByName,
  RouteOrganizerMemberRoom,
  RouteOrganizerLobbyRoom,
  RouteOrganizerPolls,
  RouteOrganizerPollResults,
  RouteOrganizerEvents
} from "@/router/routes";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useQuery, useSubscription } from "@vue/apollo-composable";
import { EVENT_USERS } from "@/modules/organizer/graphql/queries/event-users";
import { NEW_EVENT_USER } from "@/modules/organizer/graphql/subscription/new-event-user";
import { EVENT_USER_LIFE_CYCLE } from "@/modules/organizer/graphql/subscription/event-user-life-cycle";

const route = useRoute();
const eventId = route.params.id;
const params = useRoute().params;
const eventUsers = ref([]);

// Fetch event users..
const eventUsersQuery = useQuery(
  EVENT_USERS,
  { eventId },
  { fetchPolicy: "cache-and-network" },
);
eventUsersQuery.onResult(({ data }) => {
  if (data?.eventUsers) {
    eventUsers.value = data?.eventUsers;
  }
});

// Computed.

const verifiedUsersCount = computed(() => {
  const count = eventUsers.value.filter((eventUser) => eventUser.verified)?.length ?? 0;
  if (import.meta.env.DEV) {
    console.log('[ORGANIZER DEBUG] EventNavigation - Verified users count:', count);
  }
  return count;
});

const pendingUsersCount = computed(() => {
  const count = eventUsers.value.filter((eventUser) => !eventUser.verified)?.length ?? 0;
  if (import.meta.env.DEV) {
    console.log('[ORGANIZER DEBUG] EventNavigation - Pending users count:', count, 'Total users:', eventUsers.value.length);
  }
  return count;
});

// Subscriptions.

const newEventUserSubscription = useSubscription(NEW_EVENT_USER, {
  eventId
});
newEventUserSubscription.onResult(({ data }) => {
  if (import.meta.env.DEV) {
    console.log('[ORGANIZER DEBUG] EventNavigation - NEW_EVENT_USER received:', data);
  }
  
  if (!data?.newEventUser) {
    if (import.meta.env.DEV) {
      console.warn('[ORGANIZER DEBUG] EventNavigation - No newEventUser in subscription data');
    }
    return;
  }
  
  if (parseInt(data?.newEventUser?.eventId, 10) !== parseInt(eventId, 10)) {
    if (import.meta.env.DEV) {
      console.warn('[ORGANIZER DEBUG] EventNavigation - Event ID mismatch:', {
        received: data?.newEventUser?.eventId,
        expected: eventId
      });
    }
    return;
  }

  if (import.meta.env.DEV) {
    console.log('[ORGANIZER DEBUG] EventNavigation - Adding new user to list:', data?.newEventUser);
  }
  
  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  copyOfEventUsers.push({ ...data?.newEventUser });

  eventUsers.value = copyOfEventUsers;
});

const eventUserLifeCycleSubscription = useSubscription(EVENT_USER_LIFE_CYCLE, {
  eventId
});
eventUserLifeCycleSubscription.onResult(({ data }) => {
  if (import.meta.env.DEV) {
    console.log('[ORGANIZER DEBUG] EventNavigation - EVENT_USER_LIFE_CYCLE received:', data);
  }
  
  if (!data || !data.eventUserLifeCycle) {
    if (import.meta.env.DEV) {
      console.warn('[ORGANIZER DEBUG] EventNavigation - No valid data in eventUserLifeCycle event');
    }
    return;
  }
  // We have to make a copy to add a new entry to the event users array.
  const copyOfEventUsers = JSON.parse(JSON.stringify(eventUsers.value));
  const eventUser = copyOfEventUsers.find((user) => {
    return (
      parseInt(user.id, 10) ===
      parseInt(data?.eventUserLifeCycle?.eventUserId, 10)
    );
  });
  
  if (!eventUser) {
    if (import.meta.env.DEV) {
      console.warn('[ORGANIZER DEBUG] EventNavigation - No matching user found for ID:', data.eventUserLifeCycle.eventUserId);
    }
    return;
  }
  
  if (import.meta.env.DEV) {
    console.log('[ORGANIZER DEBUG] EventNavigation - Updating user online status:', {
      userId: eventUser.id,
      online: data?.eventUserLifeCycle?.online
    });
  }
  
  eventUser.online = data?.eventUserLifeCycle?.online;
  eventUsers.value = copyOfEventUsers;
});
</script>

<style lang="scss" scoped>
.navigation-item {
  .nav-title {
    margin-right: 0.25rem;
  }

  .router-link-active {
    .nav-icon,
    .nav-title {
      color: white;
    }
  }

  :hover {
    .nav-icon,
    .nav-title {
      color: black;
    }
  }
}
</style>
