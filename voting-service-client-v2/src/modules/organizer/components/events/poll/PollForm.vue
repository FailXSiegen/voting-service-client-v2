<template>
  <form v-if="loaded" class="mutate-poll">
    <!-- TEST: Diese Warnung wird IMMER angezeigt -->
    <div class="alert alert-danger mb-3" role="alert">
      <strong>TEST:</strong> Diese Warnung sollte IMMER sichtbar sein! Wenn du das siehst, funktioniert das Template.
    </div>
    
    <!-- Warnung für asynchrone Events ohne Teilnehmer -->
    <div v-if="showAsyncEventWarning" class="alert alert-warning mb-3" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      <strong>Hinweis:</strong> Für asynchrone Veranstaltungen (Briefwahl) muss mindestens ein Teilnehmer vorhanden sein, um Abstimmungen erstellen zu können.
    </div>
    
    <div class="mb-3">
      <BaseInput
        :label="$t('view.polls.create.labels.title')"
        :errors="v$.title?.$errors"
        :has-errors="v$.title?.$errors?.length > 0"
        :value="formData.title"
        :placeholder="$t('view.polls.create.labels.title')"
        @change="
          ({ value }) => {
            formData.title = value;
          }
        "
      />
    </div>
    <p>{{ $t("view.polls.headlines.answerOptionsTitle") }}</p>
    <div class="mb-3 card card-body bg-light">
      <RadioInput
        id="poll-answer-options"
        :items="answerOptions"
        :value="formData?.pollAnswer"
        @change="onChangePollAnswerOption"
      />
      <div v-if="formData?.pollAnswer === 'custom'" class="card card-body">
        <TextInput
          :rows="3"
          :label="$t('view.polls.create.labels.listOfAnswerOptions')"
          :errors="v$.list?.$errors"
          :has-errors="v$.list?.$errors?.length > 0"
          :value="formData.list"
          :help-text="$t('view.polls.create.labels.listOfAnswerOptionsInfo')"
          @change="onChangeListText"
        />
        <NumberInput
          :label="$t('view.polls.create.labels.maxVotes')"
          :errors="v$.maxVotes?.$errors"
          :has-errors="v$.maxVotes?.$errors?.length > 0"
          :value="formData.maxVotes"
          :min="0"
          :classes="['w-auto']"
          :help-text="$t('view.polls.create.labels.maxVotesInfo')"
          @change="
            ({ value }) => {
              formData.maxVotes = value;
            }
          "
        />
        <NumberInput
          :label="$t('view.polls.create.labels.minVotes')"
          :errors="v$.minVotes?.$errors"
          :has-errors="v$.minVotes?.$errors?.length > 0"
          :value="formData.minVotes"
          :min="0"
          :classes="['w-auto']"
          :help-text="$t('view.polls.create.labels.minVotesInfo')"
          @change="
            ({ value }) => {
              formData.minVotes = value;
            }
          "
        />
        <CheckboxInput
          id="allowAbstain"
          v-model:checked="formData.allowAbstain"
          :label="$t('view.polls.create.labels.abstention')"
          :errors="v$.allowAbstain?.$errors"
          :has-errors="v$.allowAbstain?.$errors?.length > 0"
          @update="
            ({ value }) => {
              formData.allowAbstain = value;
            }
          "
        />
      </div>
    </div>
    <div class="mb-3 card card-body bg-light">
      <RadioInput
        id="poll-answer-options"
        :items="pollTypes"
        :value="formData?.type"
        @change="
          ({ value }) => {
            formData.type = value;
          }
        "
      />
    </div>
    <div class="row">
      <div class="col-12 col-md-6 mb-3">
        <button
          class="btn btn-primary d-block w-100"
          type="submit"
          :disabled="isSubmitting"
          @click.prevent="onSubmit()"
        >
          <i class="bi-plus bi--2xl align-middle" />
          <span class="align-middle">
            {{ $t("view.polls.create.labels.saveOnly") }}
          </span>
        </button>
      </div>
      <div class="col-12 col-md-6 mb-3">
        <button
          v-if="showSubmitAndStartButton"
          class="btn btn-secondary d-block w-100"
          type="submit"
          :disabled="currentOnlineUserCount === 0 || isSubmitting"
          @click.prevent="onSubmitAndStart()"
        >
          <i class="bi-play bi--2xl align-middle" />
          <span class="align-middle">
            {{ $t("view.polls.create.labels.saveAndStart") }}
          </span>
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import BaseInput from "@/core/components/form/BaseInput.vue";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import TextInput from "@/core/components/form/TextInput.vue";
import RadioInput from "@/core/components/form/RadioInput.vue";
import NumberInput from "@/core/components/form/NumberInput.vue";
import { required, requiredIf } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { useRoute } from "vue-router";
import t from "@/core/util/l18n";
import { useQuery } from "@vue/apollo-composable";
import { EVENT_USERS } from "@/modules/organizer/graphql/queries/event-users";
import { EVENT } from "@/modules/organizer/graphql/queries/event";
import { useCore } from "@/core/store/core";

const emit = defineEmits(["submit", "submitAndStart"]);
const props = defineProps({
  prefillData: {
    type: Object,
    required: false,
    default: null,
  },
  showSubmitAndStartButton: {
    type: Boolean,
    default: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

onMounted(() => {
  updatePollAnswers();
});

// Data.
const coreStore = useCore();
const route = useRoute();
const id = route.params.id;
const loaded = ref(false);
const eventUsers = ref([]);
const event = ref(null);
const currentOnlineUserCount = computed(() => {
  if (!eventUsers.value || eventUsers.value.length === 0) {
    return 0;
  }
  return (eventUsers.value || []).filter((eventUser) => {
    return eventUser?.verified && eventUser?.online && eventUser?.allowToVote;
  }).length;
});

// Check if this is an async event without participants
const showAsyncEventWarning = computed(() => {
  return event.value?.async === true && (eventUsers.value || []).length === 0;
});

// Fetch event data first
const eventQuery = useQuery(
  EVENT,
  { id, organizerId: coreStore.user.id },
  { fetchPolicy: "no-cache" },
);
eventQuery.onResult(({ data }) => {
  if (data?.event) {
    event.value = data.event;
    console.log('[PollForm] Event loaded:', data.event);
    
    // Load event users
    const eventUsersQuery = useQuery(
      EVENT_USERS,
      { eventId: id },
      { fetchPolicy: "cache-and-network" },
    );
    eventUsersQuery.onResult(({ data: usersData }) => {
      if (usersData?.eventUsers) {
        eventUsers.value = usersData.eventUsers;
        console.log('[PollForm] Event users loaded:', usersData.eventUsers.length);
      }
      loaded.value = true;
    });
  } else {
    loaded.value = true;
  }
});

// Form and validation setup.
const formData = reactive({
  title: props.prefillData?.title ?? "",
  type: props.prefillData?.type ?? "SECRET",
  pollAnswer: props.prefillData?.pollAnswer ?? "yesNoAbstain",
  list: props.prefillData?.list ?? "",
  minVotes: props.prefillData?.minVotes ?? 0,
  maxVotes: props.prefillData?.maxVotes ?? 1,
  allowAbstain: props.prefillData?.allowAbstain ?? false,
  possibleAnswers: props.prefillData?.possibleAnswers ?? [],
});

const rules = computed(() => {
  return {
    title: { required },
    type: { required },
    pollAnswer: { required },
    list: {
      requiredIf: requiredIf(formData.pollAnswer === "custom"),
    },
    minVotes: { required },
    maxVotes: { required },
    allowAbstain: requiredIf(formData.maxVotes <= 1),
    possibleAnswers: { required },
  };
});
const v$ = useVuelidate(rules, formData);

const answerOptions = [
  {
    label: t("view.polls.create.labels.yesNo"),
    value: "yesNo",
  },
  {
    label: t("view.polls.create.labels.yesNoAbstain"),
    value: "yesNoAbstain",
  },
  {
    label: t("view.polls.create.labels.custom"),
    value: "custom",
  },
];
const pollTypes = [
  {
    label: t("view.polls.create.labels.openPoll"),
    value: "PUBLIC",
  },
  {
    label: t("view.polls.create.labels.secretPoll"),
    value: "SECRET",
  },
];

// Events.

function onChangePollAnswerOption({ value }) {
  formData.pollAnswer = value;
  updatePollAnswers();
}

function onChangeListText({ value }) {
  formData.list = value;
  convertListTextToPollAnswers();
}

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  // Reset abstain if max votes is bigger 1.
  if (formData.maxVotes > 1) {
    formData.allowAbstain = false;
  }

  emit("submit", formData);
}

async function onSubmitAndStart() {
  if (!props.showSubmitAndStartButton) {
    return;
  }
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  emit("submitAndStart", formData);
}

// Functions.

function updatePollAnswers() {
  switch (formData.pollAnswer) {
    case "custom":
      convertListTextToPollAnswers();
      return;
    case "yesNoAbstain":
      formData.possibleAnswers = [
        {
          content: "Ja",
        },
        {
          content: "Nein",
        },
        {
          content: "Enthaltung",
        },
      ];
      formData.list = "";
      formData.allowAbstain = false;
      formData.maxVotes = 1;
      formData.minVotes = 0;
      break;
    case "yesNo":
      formData.possibleAnswers = [
        {
          content: "Ja",
        },
        {
          content: "Nein",
        },
      ];
      break;
    default:
      throw new Error(
        `Invalid answer type '${formData.pollAnswer}' given. Allowed are: 'yesNoAbstain', 'yesNo', 'custom'`,
      );
  }
  // Reset custom answer related properties.
  formData.list = "";
  formData.allowAbstain = false;
  formData.maxVotes = 1;
  formData.minVotes = 0;
}

function convertListTextToPollAnswers() {
  formData.possibleAnswers = [];
  const rows = formData.list.split("\n");
  for (const row of rows) {
    if (row.trim().length > 0) {
      formData.possibleAnswers.push({ content: row.trim() });
    }
  }
}
</script>

<style lang="scss" scoped>
.mutate-poll {
  max-width: 840px;
}
</style>
