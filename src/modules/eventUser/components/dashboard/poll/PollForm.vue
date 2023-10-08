<template>
  <form
    id="poll-form"
    class="needs-validation"
    @submit.prevent="onSubmit"
  >
    <!-- Can only select one. -->
    <fieldset v-if="voteType === VOTE_TYPE_SINGLE">
      <RadioInput
        id="poll-answer"
        :items="possibleAnswers"
        :value="null"
        :has-errors="v$.singleAnswer?.$errors?.length > 0"
        @change="({value}) => {formData.singleAnswer = parseInt(value, 10);}"
      />
    </fieldset>

    <!-- Can select multiple or all. -->
    <fieldset
      v-else-if="voteType === VOTE_TYPE_MULTIPLE_ALL"
      :disabled="formData.abstain"
    >
      <CheckboxInputGroup
        :items="possibleAnswers"
        :has-errors="v$.multipleAnswers?.$errors?.length > 0"
        :max-checked-items="poll.maxVotes || null"
        :min-checked-items="poll.minVotes || null"
        @change="(value) => {formData.multipleAnswers = value}"
      />
    </fieldset>

    <!-- Abstain. -->
    <template v-if="poll.allowAbstain && voteType !== VOTE_TYPE_SINGLE">
      <hr>
      <fieldset>
        <CheckboxInput
          id="allow-abstain"
          :label="$t('view.polls.modal.abstain')"
          :help-text="$t('view.polls.modal.abstainHelptext') "
          @update:checked="formData.abstain = !formData.abstain"
        />
      </fieldset>
    </template>

    <!-- Force answer/s for each vote -->
    <hr v-if="canSubmitAnswerForEachVote">
    <fieldset v-if="canSubmitAnswerForEachVote">
      <CheckboxInput
        id="submit-answer-for-each-vote"
        :label="$t('view.polls.modal.canSubmitAnswerForEachVote',{voteAmount: eventUser.voteAmount})"
        :help-text="$t('view.polls.modal.canSubmitAnswerForEachVoteHelptext')"
        @update:checked="formData.useAllAvailableVotes = !formData.useAllAvailableVotes"
      />
    </fieldset>

    <hr>
    <button
      type="submit"
      class="btn btn-primary float-right"
    >
      {{ $t('view.polls.modal.submitPoll') }}
    </button>
  </form>
</template>

<script setup>
import {handleError} from "@/core/error/error-handler";
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {computed, reactive} from "vue";
import {and, or, required} from "@vuelidate/validators";
import {useVuelidate} from "@vuelidate/core";
import RadioInput from "@/core/components/form/RadioInput.vue";
import CheckboxInputGroup from "@/core/components/form/CheckboxInputGroup.vue";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import {
  minLength,
  objectPropertyIsEqual,
  objectPropertyIsGreaterThan,
  maxLength,
  objectPropertyIsNotEqual
} from "@/core/form/validation/same-as";

const VOTE_TYPE_SINGLE = 1;
const VOTE_TYPE_MULTIPLE_ALL = 2;

const emit = defineEmits(['submit']);
const props = defineProps({
  poll: {
    type: Object,
    required: true
  },
  event: {
    type: Object,
    required: true
  },
  eventUser: {
    type: Object,
    required: true
  },
  voteCounter: {
    type: Number,
    required: true
  },
});

// Computed.

const voteType = computed(() => {
  if (props.poll.maxVotes === 1) {
    return VOTE_TYPE_SINGLE;
  }
  if (props.poll.maxVotes > 1 || props.poll.maxVotes === 0) {
    return VOTE_TYPE_MULTIPLE_ALL;
  }
  throw Error('Invalid voting setup!');
});

const possibleAnswers = computed(() => {
  const result = [];
  props.poll.possibleAnswers.forEach((answer) => {
    result.push({
      label: answer.content,
      value: parseInt(answer.id, 10)
    });
  });

  return result;
});

const canSubmitAnswerForEachVote = computed(() =>
  props.eventUser.voteAmount > 1 && props.voteCounter === 1 && props.event.multivoteType === 1
);

// Form and validation setup.

const formData = reactive({
  singleAnswer: null,
  multipleAnswers: [],
  abstain: false,
  useAllAvailableVotes: false
});

const rules = computed(() => {
  return {
    singleAnswer: {
      or: or(
        // Not the correct voting type, so skip validation for this property.
        objectPropertyIsNotEqual('value', voteType, VOTE_TYPE_SINGLE),
        // Min vote = 1 and max vote = 1 (Required to pick 1 answer).
        and(
          objectPropertyIsEqual('minVotes', props.poll, 1),
          objectPropertyIsEqual('maxVotes', props.poll, 1),
          required
        ),
        // Min vote = 0 and max vote = 1 (Can pick 1 answer).
        and(
          objectPropertyIsEqual('minVotes', props.poll, 0),
          objectPropertyIsEqual('maxVotes', props.poll, 1),
        ),
      ),
    },
    multipleAnswers: {
      or: or(
        // Not the correct voting type, so skip validation for this property.
        objectPropertyIsNotEqual('value', voteType, VOTE_TYPE_MULTIPLE_ALL),
        // Min vote = 0 and max vote = 0 (Do what you want)
        and(
          objectPropertyIsEqual('minVotes', props.poll, 0),
          objectPropertyIsEqual('maxVotes', props.poll, 0),
        ),
        // Min vote = 0 and max vote > 0 (can not be greater than max vote)
        and(
          objectPropertyIsEqual('minVotes', props.poll, 0),
          objectPropertyIsGreaterThan('maxVotes', props.poll, 0),
          maxLength(props.poll.maxVotes),
        ),
        // Min vote > 0 and max vote = 0 (must be at least the length of min vote)
        and(
          objectPropertyIsGreaterThan('minVotes', props.poll, 0),
          objectPropertyIsEqual('maxVotes', props.poll, 0),
          minLength(props.poll.minVotes),
        ),
        // Min vote > 0 and max vote > 0
        // (must be at least the length of min vote but can not be greater than max vote)
        and(
          objectPropertyIsGreaterThan('minVotes', props.poll, 0),
          objectPropertyIsGreaterThan('maxVotes', props.poll, 0),
          maxLength(props.poll.maxVotes),
          minLength(props.poll.minVotes),
        ),
        // Allow to abstain.
        and(
          objectPropertyIsEqual('allowAbstain', props.poll, true),
          objectPropertyIsEqual('abstain', formData, true)
        ),
      )
    }
  };
});
const v$ = useVuelidate(rules, formData);

// Events.

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }
  formData.type = voteType.value;
  emit('submit', formData);
}
</script>
