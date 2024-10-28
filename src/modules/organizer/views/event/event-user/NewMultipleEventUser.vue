<template>
  <PageLayout :meta-title="$t('navigation.views.organizerEventUserMultipleNew')">
    <template #title>
      <div class="events-new-title">
        {{ $t("navigation.views.organizerEventUserMultipleNew") }} -
        <span v-if="event?.title">{{ event?.title }}</span>
      </div>
    </template>
    <template #header>
      <EventNavigation :routes="routes" />
    </template>
    <template #content>
      <MultipleNewEventUserForm 
        @submit="onSubmit" 
        :is-processing="isProcessing"
        :progress="progress"
      />
      <!-- Error Summary -->
      <div v-if="errorSummary.show" class="alert alert-warning mt-3">
        <h5>{{ $t('view.event.create.labels.eventUser.errorSummary.title') }}</h5>
        <p>{{ $t('view.event.create.labels.eventUser.errorSummary.description', { 
          total: errorSummary.total,
          success: errorSummary.success,
          failed: errorSummary.failed 
        }) }}</p>
        <ul v-if="errorSummary.errors.length">
          <li v-for="(error, index) in errorSummary.errors" :key="index">
            {{ error.username }}: {{ error.message }}
          </li>
        </ul>
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useMutation, useQuery } from "@vue/apollo-composable";
import { toast } from "vue3-toastify";
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import EventNavigation from "@/modules/organizer/components/EventNavigation.vue";
import MultipleNewEventUserForm from "@/modules/organizer/components/events/event-user/MultipleNewEventUserForm.vue";
import { RouteOrganizerDashboard, RouteOrganizerMemberRoom } from "@/router/routes";
import { useCore } from "@/core/store/core";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { CREATE_EVENT_USER } from "@/modules/organizer/graphql/mutation/create-event-user";
import { CREATE_EVENT_USER_AUTH_TOKEN } from "@/modules/organizer/graphql/mutation/create-event-user-auth-token";
import { handleError } from "@/core/error/error-handler";
import { NetworkError } from "@/core/error/NetworkError";
import t from "@/core/util/l18n";

// Store and Router setup
const coreStore = useCore();
const router = useRouter();
const route = useRoute();
const id = route.params.id;

// Reactive state
const loaded = ref(false);
const event = ref(null);
const isProcessing = ref(false);
const progress = reactive({
  current: 0,
  total: 0,
  processing: false
});

const errorSummary = reactive({
  show: false,
  total: 0,
  success: 0,
  failed: 0,
  errors: []
});

// Event query
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  { fetchPolicy: "no-cache" }
);

// Mutations setup - declare these at the component level
const { mutate: createEventUserStandard } = useMutation(CREATE_EVENT_USER);
const { mutate: createEventUserToken } = useMutation(CREATE_EVENT_USER_AUTH_TOKEN);

eventQuery.onResult(({ data }) => {
  if (null === data?.event) {
    handleError(new NetworkError());
    router.push({ name: RouteOrganizerDashboard });
    return;
  }
  event.value = data?.event;
  loaded.value = true;
});

// Batch processing configuration
const BATCH_SIZE = 5;
const BATCH_DELAY = 1000; // 1 second

// Process a single user with retry logic
async function processUser(userData, isTokenBased, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const mutate = isTokenBased ? createEventUserToken : createEventUserStandard;
      const result = await mutate({ input: userData });
      return result;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

// Process a batch of users
async function processBatch(batch, isTokenBased, results) {
  const batchPromises = batch.map(userData => 
    processUser(userData, isTokenBased)
      .then(result => {
        results.successful.push({ 
          username: userData.username || userData.email, 
          result 
        });
        progress.current++;
      })
      .catch(error => {
        results.failed.push({ 
          username: userData.username || userData.email, 
          error: error.message 
        });
        progress.current++;
      })
  );

  await Promise.all(batchPromises);
}

// Create users in batches
async function createUsersInBatches(userDataList, isTokenBased) {
  const results = {
    successful: [],
    failed: []
  };

  // Split into batches
  const batches = [];
  for (let i = 0; i < userDataList.length; i += BATCH_SIZE) {
    batches.push(userDataList.slice(i, i + BATCH_SIZE));
  }

  // Process each batch
  for (const batch of batches) {
    await processBatch(batch, isTokenBased, results);
    // Wait between batches
    if (batches.indexOf(batch) !== batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return results;
}

// Submit handler
async function onSubmit({ usernames, allowToVote, voteAmount, tokenBasedLogin }) {
  isProcessing.value = true;
  progress.current = 0;
  progress.total = usernames.length;
  errorSummary.show = false;
  errorSummary.errors = [];

  try {
    // Prepare user data
    const userDataList = usernames.map(username => ({
      eventId: id,
      verified: true,
      allowToVote,
      voteAmount: voteAmount || 0,
      [tokenBasedLogin ? "email" : "username"]: username
    }));

    // Process users in batches
    const results = await createUsersInBatches(userDataList, tokenBasedLogin);

    // Update error summary
    errorSummary.total = usernames.length;
    errorSummary.success = results.successful.length;
    errorSummary.failed = results.failed.length;
    errorSummary.errors = results.failed;
    errorSummary.show = results.failed.length > 0;

    // Show success message if any users were created
    if (results.successful.length > 0) {
      toast(t("success.organizer.eventUser.createdSuccessfully"), {
        type: "success"
      });
    }

    // Only redirect if all users were created successfully
    if (results.failed.length === 0) {
      await router.push({ name: RouteOrganizerMemberRoom });
    }
  } catch (error) {
    handleError(error);
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style lang="scss" scoped>
.alert {
  max-width: 840px;
  
  ul {
    margin-top: 1rem;
    margin-bottom: 0;
  }
}
</style>