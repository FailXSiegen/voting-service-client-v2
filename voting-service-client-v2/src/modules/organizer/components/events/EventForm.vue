<template>
  <div class="events-new">
    <form @submit.prevent="onSubmit('save')">
      <!-- Nav tabs -->
      <ul class="nav nav-tabs mb-4" role="tablist">
        <li class="nav-item">
          <button 
            id="general-tab" 
            class="nav-link active"
            data-bs-toggle="tab" 
            data-bs-target="#general"
            type="button"
            role="tab"
            aria-controls="general"
            aria-selected="true"
          >
            {{ $t('view.event.create.tabs.general') }}
          </button>
        </li>
        <li class="nav-item">
          <button 
            id="rules-tab" 
            class="nav-link"
            data-bs-toggle="tab" 
            data-bs-target="#rules"
            type="button"
            role="tab"
            aria-controls="rules"
            aria-selected="false"
          >
            {{ $t('view.event.create.tabs.rules') }}
          </button>
        </li>
        <li class="nav-item">
          <button 
            id="styling-tab" 
            class="nav-link"
            data-bs-toggle="tab" 
            data-bs-target="#styling"
            type="button"
            role="tab"
            aria-controls="styling"
            aria-selected="false"
          >
            {{ $t('view.event.create.tabs.styling') }}
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- General Settings -->
        <div id="general" class="tab-pane fade show active" role="tabpanel" aria-labelledby="general-tab">
          <div class="row">
            <div class="col-12 col-md-6">
              <div class="mb-3">
                <BaseInput
                  :label="$t('view.event.create.labels.title')"
                  :errors="v$.title?.$errors"
                  :has-errors="v$.title?.$errors?.length > 0"
                  :value="formData.title"
                  @change="({ value }) => { formData.title = value; }"
                />
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="mb-3">
                <SlugInput
                  :label="$t('view.event.create.labels.slug')"
                  :errors="v$.slug?.$errors"
                  :has-errors="v$.slug?.$errors?.length > 0"
                  :value="formData.slug"
                  :base-value="formData.title"
                  :help-text="$t('view.event.create.labels.slugHelp')"
                  @change="({ value }) => { formData.slug = value; }"
                />
              </div>
            </div>
          </div>

          <div class="mb-3">
            <TextInput
              :rows="3"
              :label="$t('view.event.create.labels.description')"
              :errors="v$.description?.$errors"
              :has-errors="v$.description?.$errors?.length > 0"
              :value="formData.description"
              :help-text="$t('view.event.create.labels.descriptionHelp')"
              @change="({ value }) => { formData.description = value; }"
            />
          </div>

          <div class="mb-3">
            <DateInput
              :label="$t('view.event.create.labels.scheduledDatetime')"
              :errors="v$.scheduledDatetime?.$errors"
              :has-errors="v$.scheduledDatetime?.$errors?.length > 0"
              :value="formData.scheduledDatetime"
              @change="({ value }) => { formData.scheduledDatetime = value; }"
            />
          </div>

          <template v-if="formData.async">
            <div class="mb-3">
              <DateInput
                :label="$t('view.event.create.labels.endDatetime')"
                :errors="v$.endDatetime?.$errors"
                :has-errors="v$.endDatetime?.$errors?.length > 0"
                :value="formData.endDatetime"
                @change="({ value }) => (formData.endDatetime = value)"
              />
            </div>
          </template>

          <div class="mb-3">
            <CheckboxInput
              v-model:checked="formData.lobbyOpen"
              :label="$t('view.event.create.labels.lobbyOpen')"
              :errors="v$.lobbyOpen?.$errors"
              :has-errors="v$.lobbyOpen?.$errors?.length > 0"
              @update="({ value }) => { formData.lobbyOpen = value; }"
            />
          </div>

          <div class="mb-3">
            <CheckboxInput
              v-model:checked="formData.active"
              :label="$t('view.event.create.labels.active')"
              :errors="v$.active?.$errors"
              :has-errors="v$.lobbyOpen?.active?.length > 0"
              @update="({ value }) => { formData.active = value; }"
            />
          </div>

          <div class="mb-3">
            <CheckboxInput
              v-model:checked="formData.async"
              :label="$t('view.event.create.labels.async')"
              :errors="v$.async?.$errors"
              :has-errors="v$.async?.$errors?.length > 0"
              @update="({ value }) => { formData.async = value; }"
            />
          </div>

          <div class="mb-3 d-flex">
            <CheckboxInput
              v-model:checked="formData.allowMagicLink"
              :label="$t('view.event.create.labels.allowMagicLink')"
              :errors="v$.allowMagicLink?.$errors"
              :has-errors="v$.allowMagicLink?.$errors?.length > 0"
              @update="({ value }) => { formData.allowMagicLink = value; }"
            />
            <div class="ms-2">
              <i ref="popoverTrigger" class="bi bi-question-circle"></i>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="mb-3">
                <VideoConferenceSelect
                  :label="$t('view.event.create.labels.videoConferenceSelect')"
                  :errors="v$.videoConference?.$errors"
                  :has-errors="v$.videoConference?.$errors?.length > 0"
                  :value="formData.videoConference?.id"
                  @change="onChangeVideoConference"
                />
              </div>
              <component
                :is="videoConfigComponent"
                v-if="videoConfigComponent && formData.videoConference?.id"
                :record-id="formData.videoConference?.id"
                :config="formData?.videoConferenceConfig"
                @change="onChangeVideoConfig"
              />
            </div>
          </div>
        </div>

        <!-- Rules Tab -->
        <div id="rules" class="tab-pane fade" role="tabpanel" aria-labelledby="rules-tab">
          <h3>{{ $t("view.event.create.labels.multivoteTypeTitle") }}</h3>
          <p class="text-muted">
            {{ $t("view.event.create.labels.multivoteTypeInfo") }}
          </p>
          <RadioInput
            :items="radioOptions"
            :value="formData.multivoteType.toString()"
            @change="({ value }) => { formData.multivoteType = parseInt(value, 10); }"
          />

          <div class="mb-3 d-flex mt-4">
            <CheckboxInput
              v-model:checked="formData.publicVoteVisible"
              :label="$t('view.event.create.labels.publicVoteVisible')"
              :errors="v$.publicVoteVisible?.$errors"
              :has-errors="v$.publicVoteVisible?.$errors?.length > 0"
              @update="({ value }) => { formData.publicVoteVisible = value; }"
            />
          </div>

          <div class="mb-3 d-flex mt-4">
            <CheckboxInput
              v-model:checked="formData.publicnameReadonly"
              :label="$t('view.event.create.labels.publicnameReadonly')"
              :errors="v$.publicnameReadonly?.$errors"
              :has-errors="v$.publicnameReadonly?.$errors?.length > 0"
              @update="({ value }) => { formData.publicnameReadonly = value; }"
            />
          </div>
        </div>

        <!-- Styling Tab -->
        <div id="styling" class="tab-pane fade" role="tabpanel" aria-labelledby="styling-tab">
          <div class="mb-3">
            <LogoUpload
              v-model="formData.logo"
              :label="$t('view.event.create.labels.logo')"
              :errors="v$.logo?.$errors"
              :has-errors="v$.logo?.$errors?.length > 0"
              @change="({ value }) => { formData.logo = value; }"
            />
          </div>
          <div class="mb-3">
            <BootstrapStylesInput
              v-model="formData.styles"
              :label="$t('view.event.create.labels.styles')"
              :errors="v$.styles?.$errors"
              :has-errors="v$.styles?.$errors?.length > 0"
              :help-text="$t('view.event.create.labels.stylesHelp')"
              @change="({ value }) => { formData.styles = value; }"
            />
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="d-flex gap-2 mt-5 mb-3">
        <button type="submit" class="btn btn-primary me-2">
          <i class="bi-play bi--2xl align-middle" />
          <span class="align-middle">
            {{ $t("view.event.create.labels.submit") }}
          </span>
        </button>

        <button type="button" class="btn btn-secondary" @click="onSubmit('save_and_continue')">
          <i class="bi-pencil bi--2xl align-middle" />
          <span class="align-middle">
            {{ $t("view.event.create.labels.submitAndContinue") }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import {
  computed,
  reactive,
  shallowRef,
  watch,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { required, requiredIf } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import BaseInput from "@/core/components/form/BaseInput.vue";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import t from "@/core/util/l18n";
import { useCore } from "@/core/store/core";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import SlugInput from "@/core/components/form/SlugInput.vue";
import TextInput from "@/core/components/form/TextInput.vue";
import DateInput from "@/core/components/form/DateInput.vue";
import ZoomConfig from "@/modules/organizer/components/events/video-conference-config/ZoomConfig.vue";
import VideoConferenceSelect from "@/modules/organizer/components/form/VideoConferenceSelect.vue";
import RadioInput from "@/core/components/form/RadioInput.vue";
import BootstrapStylesInput from "@/core/components/form/BootstrapStylesInput.vue";
import LogoUpload from "@/core/components/form/LogoUpload.vue";
import * as bootstrap from "bootstrap";
const popoverTrigger = ref(null);

onMounted(() => {
  if (popoverTrigger.value) {
    const popover = new bootstrap.Popover(popoverTrigger.value, {
      title: t("view.event.create.labels.magicLink.popover.title"),
      content: t("view.event.create.labels.magicLink.popover.description"),
      trigger: "click focus",
      placement: "top",
      html: true,
    });
    const clickHandler = (event) => {
      const clickedElement = event.target;
      if (
        !popoverTrigger.value.contains(clickedElement) &&
        !document.querySelector(".popover")?.contains(clickedElement)
      ) {
        popover.hide();
      }
    };

    document.addEventListener("click", clickHandler);

    onUnmounted(() => {
      document.removeEventListener("click", clickHandler);
      popover.dispose();
    });
  }
});

const emit = defineEmits(["submit"]);
const props = defineProps({
  prefillData: {
    type: Object,
    required: false,
    default: null,
  },
});

const videoConfigComponent = shallowRef(null);

const coreStore = useCore();

const radioOptions = [
  {
    label: t("view.event.create.labels.multivoteRadio1Label"),
    helpText: t("view.event.create.labels.multivoteRadio1Help"),
    value: "1",
  },
  {
    label: t("view.event.create.labels.multivoteRadio2Label"),
    helpText: t("view.event.create.labels.multivoteRadio2Help"),
    value: "2",
  },
];

// Form and validation setup.
const formData = reactive({
  title: props.prefillData?.title ?? "",
  slug: props.prefillData?.slug ?? "",
  description: props.prefillData?.description ?? "",
  styles: props.prefillData?.styles ?? "",
  logo: props.prefillData?.logo ?? "",
  scheduledDatetime:
    props.prefillData?.scheduledDatetime ?? Math.floor(Date.now() / 1000),
  lobbyOpen: props.prefillData?.lobbyOpen ?? false,
  active: props.prefillData?.active ?? false,
  orgnaizerId: coreStore.user?.id ?? 0,
  multivoteType: props.prefillData?.multivoteType ?? 1,
  videoConferenceConfig: props.prefillData?.videoConferenceConfig ?? "{}",
  videoConference: props.prefillData?.videoConference ?? null,
  async: props.prefillData?.async ?? false,
  allowMagicLink: props.prefillData?.allowMagicLink ?? false,
  publicVoteVisible: props.prefillData?.publicVoteVisible ?? true,
  endDatetime: props.prefillData?.endDatetime ?? Math.floor(Date.now() / 1000),
  publicnameReadonly: props.prefillData?.publicnameReadonly ?? false,
});

const rules = computed(() => {
  return {
    title: { required },
    slug: { required },
    description: { required },
    styles: {},
    logo: {},
    scheduledDatetime: { required },
    endDatetime: {
      requiredIf: requiredIf(formData.async),
    },
    lobbyOpen: { required },
    active: { required },
    async: { required },
    allowMagicLink: { required },
    publicVoteVisible: { required },
    orgnaizerId: { required },
    multivoteType: { required },
  };
});

const v$ = useVuelidate(rules, formData);

function loadVideoConfigByType() {
  switch (formData.videoConference?.__typename) {
    case "ZoomMeeting":
      videoConfigComponent.value = ZoomConfig;
      break;
    default:
      videoConfigComponent.value = null;
  }
}

function onChangeVideoConference({ value }) {
  formData.videoConference = value;

  // WICHTIGER FIX: Update video conference id in config string mit null safety
  let resolvedVideoConfig;
  try {
    resolvedVideoConfig = JSON.parse(formData.videoConferenceConfig || "{}");
  } catch (error) {
    console.warn("Failed to parse videoConferenceConfig in EventForm:", error);
    resolvedVideoConfig = {};
  }
  
  // Sicher stellen dass das Objekt existiert bevor wir .id setzen
  if (resolvedVideoConfig) {
    resolvedVideoConfig.id = formData.videoConference?.id;
  }
  formData.videoConferenceConfig = JSON.stringify(resolvedVideoConfig);

  loadVideoConfigByType();
}

function onChangeVideoConfig(config) {
  formData.videoConferenceConfig = JSON.stringify(config);
}

async function onSubmit(action = 'save') {
  const result = await v$.value.$validate();
  if (!result) {
    handleError(new InvalidFormError());
    return;
  }

  // Remove endDatetime if event is not async.
  if (!formData.async && formData.endDatetime) {
    delete formData.endDatetime;
  }

  emit("submit", { formData, action });
}

// Reset videoConferenceConfig if videoConference is unset.
watch(formData, (value) => {
  if (!value.videoConference) {
    formData.videoConferenceConfig = "{}";
  }
});

loadVideoConfigByType();
</script>

<style lang="scss" scoped>
.events-new {
  max-width: 840px;
}
</style>
