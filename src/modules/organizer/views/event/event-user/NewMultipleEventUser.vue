<template>
  <PageLayout
    :meta-title="$t('navigation.views.organizerEventUserMultipleNew')"
  >
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
        :is-processing="isProcessing"
        :progress="progress"
        @submit="onSubmit"
      />
      <!-- Error Summary -->
      <div v-if="errorSummary.show" class="alert alert-warning mt-3">
        <h5>
          {{ $t("view.event.create.labels.eventUser.errorSummary.title") }}
        </h5>
        <p>
          {{
            $t("view.event.create.labels.eventUser.errorSummary.description", {
              total: errorSummary.total,
              success: errorSummary.success,
              failed: errorSummary.failed,
            })
          }}
        </p>
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
import {
  RouteOrganizerDashboard,
  RouteOrganizerMemberRoom,
} from "@/router/routes";
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
  processing: false,
});

const errorSummary = reactive({
  show: false,
  total: 0,
  success: 0,
  failed: 0,
  errors: [],
});

// Event query
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  { fetchPolicy: "no-cache" },
);

// Mutations setup - declare these at the component level
const { mutate: createEventUserStandard } = useMutation(CREATE_EVENT_USER);
const { mutate: createEventUserToken } = useMutation(
  CREATE_EVENT_USER_AUTH_TOKEN,
);

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

// Verbesserte Fehlerextraktion
function extractErrorMessage(error) {
  if (error.graphQLErrors?.[0]?.message) {
    return error.graphQLErrors[0].message;
  }
  if (error.networkError?.message) {
    return error.networkError.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return error.message || "Ein unbekannter Fehler ist aufgetreten";
}

// Process a single user with retry logic
async function processUser(userData, isTokenBased, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const mutate = isTokenBased
        ? createEventUserToken
        : createEventUserStandard;
      const result = await mutate({ input: userData });

      if (import.meta.env.DEV) {
        console.log(
          `User created successfully: ${userData.username || userData.email}`,
        );
      }

      return { success: true, data: result };
    } catch (error) {
      lastError = error;

      if (import.meta.env.DEV) {
        console.error(
          `Attempt ${attempt + 1} failed for user: ${
            userData.username || userData.email
          }`,
          error,
        );
      }

      // Wenn der Nutzer bereits existiert, brechen wir sofort ab
      if (error.graphQLErrors?.[0]?.message?.includes("already exists")) {
        break;
      }

      // Bei anderen Fehlern versuchen wir es nochmal, wenn wir noch Versuche haben
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
        continue;
      }
    }
  }

  // Wenn wir hier ankommen, sind alle Versuche fehlgeschlagen
  return {
    success: false,
    error: extractErrorMessage(lastError),
  };
}

// Process a batch of users
async function processBatch(batch, isTokenBased, results) {
  for (const userData of batch) {
    try {
      const result = await processUser(userData, isTokenBased);

      if (result.success) {
        results.successful.push({
          username: userData.username || userData.email,
          result: result.data,
        });
      } else {
        results.failed.push({
          username: userData.username || userData.email,
          error: result.error,
        });
      }
    } catch (error) {
      // Fehler beim Processing selbst (sollte eigentlich nicht vorkommen)
      results.failed.push({
        username: userData.username || userData.email,
        error: extractErrorMessage(error),
      });
    } finally {
      // Immer den Fortschritt erhöhen, egal ob Erfolg oder Fehler
      progress.current++;
    }
  }
}

// Create users in batches
async function createUsersInBatches(userDataList, isTokenBased) {
  const results = {
    successful: [],
    failed: [],
  };

  // Split into batches
  const batches = [];
  for (let i = 0; i < userDataList.length; i += BATCH_SIZE) {
    batches.push(userDataList.slice(i, i + BATCH_SIZE));
  }

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    try {
      await processBatch(batch, isTokenBased, results);
    } catch (error) {
      // Selbst wenn ein ganzer Batch fehlschlägt, machen wir mit dem nächsten weiter
      console.error(`Batch ${i + 1} failed:`, error);
    }

    // Warte zwischen den Batches, außer beim letzten
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return results;
}

// Submit handler bleibt größtenteils gleich, aber mit verbessertem Error Handling
async function onSubmit({
  usernames,
  allowToVote,
  voteAmount,
  tokenBasedLogin,
}) {
  isProcessing.value = true;
  progress.current = 0;
  progress.total = usernames.length;
  errorSummary.show = false;
  errorSummary.errors = [];

  try {
    const userDataList = usernames.map((username) => ({
      eventId: id,
      verified: true,
      allowToVote,
      voteAmount: voteAmount || 0,
      [tokenBasedLogin ? "email" : "username"]: username,
    }));

    const results = await createUsersInBatches(userDataList, tokenBasedLogin);

    // Update error summary
    errorSummary.total = usernames.length;
    errorSummary.success = results.successful.length;
    errorSummary.failed = results.failed.length;
    errorSummary.errors = results.failed.map((fail) => ({
      username: fail.username,
      message: fail.error,
    }));
    errorSummary.show = results.failed.length > 0;

    // Show appropriate messages
    if (results.successful.length > 0) {
      toast.success(
        t("success.organizer.eventUser.createdSuccessfully", {
          count: results.successful.length,
        }),
      );
    }

    if (results.failed.length > 0) {
      toast.warning(
        t("warning.organizer.eventUser.someUsersFailed", {
          failed: results.failed.length,
          total: usernames.length,
        }),
      );
    }

    // Nur weiterleiten wenn alle erfolgreich waren
    if (results.failed.length === 0) {
      await router.push({ name: RouteOrganizerMemberRoom });
    }
  } catch (error) {
    handleError(error);
    toast.error(t("error.organizer.eventUser.processingFailed"));
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
