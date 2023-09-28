<template>
  <form
    id="poll-form"
    @submit.prevent="onSubmit"
  >
    <!-- Can only select one -->
    <fieldset v-if="voteType === VOTE_TYPE_SINGLE">
      <RadioInput
        id="poll-answer"
        :items="possibleAnswers"
        :value="null"
        :has-errors="v$.singleAnswer?.$errors?.length > 0"
        @change="({value}) => {formData.singleAnswer = parseInt(value, 10);}"
      />
    </fieldset>

    <!-- Can select all -->
    <!--              <fieldset-->
    <!--                v-if="poll.maxVotes > 1 || poll.maxVotes === 0"-->
    <!--                class="input-checkbox"-->
    <!--              >-->
    <!--                <div-->
    <!--                  v-for="(pollAnswer, index) in poll.possibleAnswers"-->
    <!--                  :key="index"-->
    <!--                  class="form-check"-->
    <!--                >-->
    <!--                  <input-->
    <!--                    :id="'pollAnswer' + poll.id + pollAnswer.id"-->
    <!--                    v-model="pollSubmitAnswerInput.answerContents"-->
    <!--                    class="form-check-input"-->
    <!--                    type="checkbox"-->
    <!--                    :value="pollAnswer.content"-->
    <!--                    :name="'pollAnswer' + poll.id"-->
    <!--                    :required="poll.minVotes > 0"-->
    <!--                    @click="setPossibleAnswerIds(pollAnswer.id)"-->
    <!--                  >-->
    <!--                  <label-->
    <!--                    class="form-check-label"-->
    <!--                    :for="'pollAnswer' + poll.id + pollAnswer.id"-->
    <!--                  >-->
    <!--                    {{ pollAnswer.content }}-->
    <!--                  </label>-->
    <!--                </div>-->
    <!--              </fieldset>-->

    <!-- can vote multiple but limited -->
    <!--              <fieldset-->
    <!--                v-if="-->
    <!--                  voteAmount > 1 && voteCounter === 1 && multiVoteType === 1-->
    <!--                "-->
    <!--              >-->
    <!--                <hr>-->
    <!--                <div class="form-check">-->
    <!--                  <input-->
    <!--                    id="multivote"-->
    <!--                    v-model="pollSubmitAnswerInput.multivote"-->
    <!--                    type="checkbox"-->
    <!--                    class="form-check-input"-->
    <!--                    value="true"-->
    <!--                  >-->
    <!--                  <label-->
    <!--                    class="form-check-label mb-0"-->
    <!--                    for="multivote"-->
    <!--                  >-->
    <!--                    Alle {{ voteAmount }} Stimmen auf einmal abgeben-->
    <!--                  </label>-->
    <!--                  <small class="form-text text-muted">-->
    <!--                    Nur bei der ersten Stimme möglich-->
    <!--                  </small>-->
    <!--                </div>-->
    <!--              </fieldset>-->

    <hr v-if="poll.allowAbstain && voteType !== VOTE_TYPE_SINGLE">

    <!--              <fieldset-->
    <!--                v-if="poll.allowAbstain"-->
    <!--                class="input-checkbox"-->
    <!--              >-->
    <!--                <div class="form-check">-->
    <!--                  <input-->
    <!--                    :id="'pollAllowAbstain' + poll.id"-->
    <!--                    class="form-check-input"-->
    <!--                    type="checkbox"-->
    <!--                    :value="$t('view.polls.modal.abstain')"-->
    <!--                    :name="'pollAllowAbstain' + poll.id"-->
    <!--                    @click="setPossibleAnswerAbstain()"-->
    <!--                  >-->
    <!--                  <label-->
    <!--                    class="form-check-label"-->
    <!--                    :for="'pollAllowAbstain' + poll.id"-->
    <!--                  >-->
    <!--                    {{ $t('view.polls.modal.abstain') }}-->
    <!--                  </label>-->
    <!--                  <small-->
    <!--                    :id="'poll' + poll.id + 'AnswerAnswerAnswersAbstainHelp'"-->
    <!--                    class="form-text text-muted"-->
    <!--                  >{{ $t('view.polls.modal.abstainHelptext') }}</small>-->
    <!--                </div>-->
    <!--              </fieldset>-->
  </form>
</template>

<script setup>
import {handleError} from "@/core/error/error-handler";
import {InvalidFormError} from "@/core/error/InvalidFormError";
import {computed, reactive, ref} from "vue";
// import {required, requiredIf} from "@vuelidate/validators";
import {useVuelidate} from "@vuelidate/core";
import t from "@/core/util/l18n";
import RadioInput from "@/core/components/form/RadioInput.vue";

const VOTE_TYPE_SINGLE = 1;
const VOTE_TYPE_MULTIPLE_ALL = 2;
const VOTE_TYPE_MULTIPLE_LIMITED = 3;

const emit = defineEmits(['submit', 'updateVoteCounter']);
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

// Form and validation setup.

const formData = reactive({
  singleAnswer: null,
  multipleAnswers: []
});
const rules = computed(() => {
  return {
    // singleAnswer: requiredIf()
  };
});
const v$ = useVuelidate(rules, formData);

// Data.

const voteCounter = ref(1);

// Computed.

const voteType = computed(() => {
  if (props.poll.maxVotes === 1) {
    return VOTE_TYPE_SINGLE;
  }
  if (props.poll.maxVotes > 1 || props.poll.maxVotes === 0) {
    return VOTE_TYPE_MULTIPLE_ALL;
  }
  if (props.eventUser.voteAmount > 1 && voteCounter.value === 1 && props.event.multivoteType === 1) {
    return VOTE_TYPE_MULTIPLE_LIMITED;
  }
  throw Error('Invalid voting setup!');
});

// const voteAmount = computed(() => props.eventUser.voteAmount);
// const multiVoteType = computed(() => props.event.multivoteType);

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

// Events.

async function onSubmit() {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  emit('submit', formData);
}
</script>
