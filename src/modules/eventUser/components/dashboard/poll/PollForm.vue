<template>
  <form id="poll-form" class="needs-validation" @submit.prevent="onSubmit">
    <!-- Vote allocation controls for users with multiple votes -->
    <fieldset v-if="hasMultipleVotes" class="alert alert-info">
      <div class="mb-3">
        <label class="form-label fw-bold">
          {{ $t('view.polls.modal.voteAllocation', { voteAmount: remainingVotes }) }}
        </label>
        
        <!-- Quick selection buttons -->
        <div class="btn-group w-100 mb-2">
          <button 
            type="button" 
            class="btn btn-outline-primary" 
            @click="setVotePercentage(25)"
            :disabled="isSubmitting"
          >
            25%
          </button>
          <button 
            type="button" 
            class="btn btn-outline-primary" 
            @click="setVotePercentage(50)"
            :disabled="isSubmitting"
          >
            50%
          </button>
          <button 
            type="button" 
            class="btn btn-outline-primary" 
            @click="setVotePercentage(75)"
            :disabled="isSubmitting"
          >
            75%
          </button>
          <button 
            type="button" 
            class="btn btn-outline-primary" 
            @click="setVotePercentage(100)"
            :disabled="isSubmitting"
          >
            100%
          </button>
        </div>
        
        <!-- Vote slider and input -->
        <div class="row mb-2">
          <div class="col-12 col-lg-8 d-flex align-items-center">
            <input 
              type="range" 
              class="form-range flex-grow-1 me-2" 
              min="1" 
              :max="remainingVotes" 
              v-model.number="formData.votesToUse"
              :disabled="isSubmitting"
            >
          </div>
          <!-- Numerical input -->
          <div class="col-12 col-lg-4">
            <div class="input-group">
              <input 
                type="number" 
                class="form-control" 
                min="1" 
                :max="remainingVotes" 
                v-model.number="formData.votesToUse"
                :disabled="isSubmitting"
              >
              <span class="input-group-text">{{ $t('view.polls.modal.votes') }}</span>
            </div>
          </div>
        </div>
        
        <div class="form-text">
          {{ $t('view.polls.modal.votesToUseHelptext') }}
        </div>
        
        <!-- Checkbox for "Use all available votes" -->
        <div class="mt-2">
          <CheckboxInput
            id="submit-answer-for-each-vote"
            :label="$t('view.polls.modal.useAllVotes')"
            :help-text="$t('view.polls.modal.canSubmitAnswerForEachVoteHelptext')"
            :checked="formData.useAllAvailableVotes"
            @update:checked="onCheckboxChange"
            :disabled="isSubmitting"
          />
        </div>
      </div>
    </fieldset>
    <hr v-if="hasMultipleVotes" />
    <div class="d-flex justify-content-center answer-wrapper">
      <!-- Can only select one. -->
      <fieldset v-if="voteType === VOTE_TYPE_SINGLE" :disabled="isSubmitting">
        <RadioInput
          id="poll-answer"
          :items="possibleAnswers"
          :value="null"
          :has-errors="v$.singleAnswer?.$errors?.length > 0"
          ckl
          @change="
            ({ value }) => {
              formData.singleAnswer = parseInt(value, 10);
            }
          "
        />
      </fieldset>

      <!-- Can select multiple or all. -->
      <fieldset
        v-else-if="voteType === VOTE_TYPE_MULTIPLE_ALL"
        :disabled="formData.abstain || isSubmitting"
      >
        <CheckboxInputGroup
          :items="possibleAnswers"
          :has-errors="v$.multipleAnswers?.$errors?.length > 0"
          :max-checked-items="poll.maxVotes || null"
          :min-checked-items="poll.minVotes || null"
          @change="
            (value) => {
              formData.multipleAnswers = value;
            }
          "
        />
      </fieldset>
    </div>
    <!-- Abstain. -->
    <template v-if="showAbstain">
      <hr />
      <fieldset :disabled="isSubmitting">
        <CheckboxInput
          id="allow-abstain"
          :label="$t('view.polls.modal.abstain')"
          :help-text="$t('view.polls.modal.abstainHelptext')"
          @update:checked="formData.abstain = !formData.abstain"
        />
      </fieldset>
    </template>

    <hr />
    <button type="submit" class="btn btn-primary mx-auto d-block h1" :disabled="isSubmitting">
      <span v-if="!isSubmitting" class="h3">{{ $t("view.polls.modal.submitPoll") }}</span>
      <span v-else class="d-flex align-items-center justify-content-center">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span class="h3">{{ $t("view.polls.modal.submitting") }}</span>
      </span>
    </button>
  </form>
</template>

<script setup>
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import { computed, reactive, watch, onMounted, ref } from "vue";
import { and, or, required } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import RadioInput from "@/core/components/form/RadioInput.vue";
import CheckboxInputGroup from "@/core/components/form/CheckboxInputGroup.vue";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import {
  minLength,
  objectPropertyIsEqual,
  objectPropertyIsGreaterThan,
  maxLength,
  objectPropertyIsNotEqual,
} from "@/core/form/validation/same-as";

const VOTE_TYPE_SINGLE = 1;
const VOTE_TYPE_MULTIPLE_ALL = 2;

const emit = defineEmits(["submit"]);
const props = defineProps({
  poll: {
    type: Object,
    required: true,
  },
  event: {
    type: Object,
    required: true,
  },
  eventUser: {
    type: Object,
    required: true,
  },
  voteCounter: {
    type: Number,
    required: true,
  },
});

const isSubmitting = ref(false);

const voteType = computed(() => {
  if (props.poll.maxVotes === 1) {
    return VOTE_TYPE_SINGLE;
  }
  if (props.poll.maxVotes > 1 || props.poll.maxVotes === 0) {
    return VOTE_TYPE_MULTIPLE_ALL;
  }
  throw Error("Invalid voting setup!");
});

const showAbstain = computed(
  () =>
    props.poll.allowAbstain &&
    props.poll.pollAnswer === "custom" &&
    props.poll.maxVotes <= 1,
);

const possibleAnswers = computed(() => {
  const result = [];
  props.poll.possibleAnswers.forEach((answer) => {
    result.push({
      label: answer.content,
      value: parseInt(answer.id, 10),
    });
  });

  return result;
});

const remainingVotes = computed(() => {
  return props.eventUser.voteAmount - props.voteCounter + 1;
});

const hasMultipleVotes = computed(() => {
  return props.eventUser.voteAmount > 1 && props.event.multivoteType === 1;
});

// Form and validation setup.
const formData = reactive({
  singleAnswer: null,
  multipleAnswers: [],
  abstain: false,
  useAllAvailableVotes: false,
  votesToUse: 1,
});

onMounted(() => {
  formData.votesToUse = Math.min(remainingVotes.value, Math.max(1, formData.votesToUse));
});

function setVotePercentage(percentage) {
  const votesToUse = Math.max(1, Math.min(
    remainingVotes.value,
    Math.round((remainingVotes.value * percentage) / 100)
  ));
  
  formData.votesToUse = votesToUse;
  
  if (percentage === 100) {
    formData.useAllAvailableVotes = true;
  } else {
    formData.useAllAvailableVotes = false;
  }
}

function onCheckboxChange(isChecked) {
  formData.useAllAvailableVotes = isChecked;
  
  if (isChecked) {
    formData.votesToUse = remainingVotes.value;
  }
}

watch(() => formData.votesToUse, (newValue, oldValue) => {
  if (newValue < 1) {
    formData.votesToUse = 1;
  } else if (newValue > remainingVotes.value) {
    formData.votesToUse = remainingVotes.value;
  }
  
  if (newValue !== oldValue) {
    formData.useAllAvailableVotes = (formData.votesToUse === remainingVotes.value);
  }
});

const rules = computed(() => {
  return {
    singleAnswer: {
      or: or(
        // Not the correct voting type, so skip validation for this property.
        objectPropertyIsNotEqual("value", voteType, VOTE_TYPE_SINGLE),
        // Min vote = 1 and max vote = 1 (Required to pick 1 answer).
        and(
          objectPropertyIsEqual("minVotes", props.poll, 1),
          objectPropertyIsEqual("maxVotes", props.poll, 1),
          required,
        ),
        // Min vote = 0 and max vote = 1 (Can pick 1 answer).
        and(
          objectPropertyIsEqual("minVotes", props.poll, 0),
          objectPropertyIsEqual("maxVotes", props.poll, 1),
        ),
      ),
    },
    multipleAnswers: {
      or: or(
        // Not the correct voting type, so skip validation for this property.
        objectPropertyIsNotEqual("value", voteType, VOTE_TYPE_MULTIPLE_ALL),
        // Min vote = 0 and max vote = 0 (Do what you want)
        and(
          objectPropertyIsEqual("minVotes", props.poll, 0),
          objectPropertyIsEqual("maxVotes", props.poll, 0),
        ),
        // Min vote = 0 and max vote > 0 (can not be greater than max vote)
        and(
          objectPropertyIsEqual("minVotes", props.poll, 0),
          objectPropertyIsGreaterThan("maxVotes", props.poll, 0),
          maxLength(props.poll.maxVotes),
        ),
        // Min vote > 0 and max vote = 0 (must be at least the length of min vote)
        and(
          objectPropertyIsGreaterThan("minVotes", props.poll, 0),
          objectPropertyIsEqual("maxVotes", props.poll, 0),
          minLength(props.poll.minVotes),
        ),
        // Min vote > 0 and max vote > 0
        // (must be at least the length of min vote but can not be greater than max vote)
        and(
          objectPropertyIsGreaterThan("minVotes", props.poll, 0),
          objectPropertyIsGreaterThan("maxVotes", props.poll, 0),
          maxLength(props.poll.maxVotes),
          minLength(props.poll.minVotes),
        ),
        // Allow to abstain.
        and(
          objectPropertyIsEqual("allowAbstain", props.poll, true),
          objectPropertyIsEqual("abstain", formData, true),
        ),
      ),
    },
    votesToUse: {
      required,
    },
  };
});
const v$ = useVuelidate(rules, formData);

// Events.

async function onSubmit() {
  if (isSubmitting.value) {
    return;
  }
  
  try {
    // Validierung
    const result = await v$.value.$validate();
    if (!result) {
      handleError(new InvalidFormError());
      return;
    }
    
    isSubmitting.value = true;
    
    formData.type = voteType.value;
    emit("submit", formData);
    
  } catch (error) {
    console.error("Fehler beim Absenden:", error);
    isSubmitting.value = false;
  }
}

defineExpose({
  isSubmitting
});
</script>