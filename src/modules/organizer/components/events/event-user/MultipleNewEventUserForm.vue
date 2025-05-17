<template>
  <div class="multiple-event-user-new">
    <form @submit.prevent="onSubmit">
      <div class="mb-3">
        <CheckboxInput
          id="tokenBasedLogin"
          v-model:checked="formData.tokenBasedLogin"
          :label="$t('view.event.create.labels.eventUser.tokenBasedLogin')"
          :help-text="
            $t('view.event.create.labels.eventUser.tokenBasedLoginHelp')
          "
          :errors="v$.tokenBasedLogin?.$errors"
          :has-errors="v$.tokenBasedLogin?.$errors?.length > 0"
          @update="
            ({ value }) => {
              formData.tokenBasedLogin = value;
            }
          "
        />
      </div>
      <div class="mb-3">
        <TextInput
          id="eventMultipleUser"
          :label="
            $t(
              'view.event.create.labels.eventMultipleUser.importFormat',
              {
                defaultValue: `${formData.tokenBasedLogin ? 'E-Mail' : 'Benutzername'};Name;Stimmen`
              }
            )
          "
          :help-text="
            $t('view.event.create.labels.eventMultipleUser.importFormatHelp', {
              defaultValue: `${formData.tokenBasedLogin ? 'email' : 'username'}[;public_name][;vote_amount]`
            })
          "
          :errors="v$.usernames?.$errors"
          :has-errors="v$.usernames?.$errors?.length > 0"
          :rows="12"
          :cols="5"
          @change="onChangeUsernamesText"
        />
      </div>
      
      <!-- Tabellarische Vorschau -->
      <div v-if="parsedPreview.length > 0" class="preview-table mb-4">
        <h5>Vorschau der zu erstellenden Benutzer</h5>
        <div class="table-responsive">
          <table class="table table-bordered table-sm">
            <thead class="table-light">
              <tr>
                <th>{{ formData.tokenBasedLogin ? 'E-Mail' : 'Benutzername' }}</th>
                <th>Anzeigename</th>
                <th>Stimmen</th>
                <th>Stimmrecht</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, index) in parsedPreview" :key="index">
                <td>{{ user.identifier }}</td>
                <td><em v-if="!user.publicName">Leer</em><span v-else>{{ user.publicName }}</span></td>
                <td>{{ user.voteAmount !== null ? user.voteAmount : 0 }}</td>
                <td>
                  <span v-if="user.allowToVote" class="badge bg-success">Ja</span>
                  <span v-else class="badge bg-secondary">Nein</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="summary">
          <small class="text-muted">
            Insgesamt: {{ parsedPreview.length }} Benutzer, 
            davon {{ parsedPreview.filter(u => u.allowToVote).length }} mit Stimmrecht.
            Gesamtstimmen: {{ getTotalVotes() }}
          </small>
        </div>
      </div>

      <!-- Progress Feedback -->
      <div v-if="isProcessing" class="progress-feedback mt-3">
        <div class="progress">
          <div
            class="progress-bar"
            role="progressbar"
            :style="{ width: `${(progress.current / progress.total) * 100}%` }"
            :aria-valuenow="progress.current"
            :aria-valuemin="0"
            :aria-valuemax="progress.total"
          >
            {{ progress.current }} / {{ progress.total }}
          </div>
        </div>
        <small class="text-muted">
          {{ $t("view.event.create.labels.eventUser.processing") }}
          <span v-if="progress.current > 0 && progress.total > 0">
            ({{ Math.round((progress.current / progress.total) * 100) }}%)
          </span>
        </small>
      </div>

      <button class="btn btn-primary mt-5 mb-3" :disabled="isProcessing">
        <i
          :class="[
            isProcessing ? 'bi-hourglass-split' : 'bi-play',
            'bi--2xl align-middle',
          ]"
        />
        <span class="align-middle">
          {{
            $t(
              isProcessing
                ? "view.event.create.labels.eventUser.processing"
                : "view.event.create.labels.eventUser.submit",
            )
          }}
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { required, requiredIf } from "@vuelidate/validators";
import { useVuelidate } from "@vuelidate/core";
import { handleError } from "@/core/error/error-handler";
import { InvalidFormError } from "@/core/error/InvalidFormError";
import CheckboxInput from "@/core/components/form/CheckboxInput.vue";
import BaseInput from "@/core/components/form/BaseInput.vue";
import TextInput from "@/core/components/form/TextInput.vue";
import { NetworkError } from "@/core/error/NetworkError";
import { isValidEmail } from "@/core/util/email-validator";

defineProps({
  isProcessing: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Object,
    default: () => ({
      current: 0,
      total: 0,
    }),
  },
});

const emit = defineEmits(["submit"]);
const usernamesText = ref("");
const parsedPreview = ref([]);

// Form data setup
const formData = reactive({
  tokenBasedLogin: false,
  usernames: [],
  usersWithData: [] // To store parsed user data with public_name and individual vote_amount
});

// Validation rules
const rules = computed(() => {
  return {
    usernames: { required },
  };
});

const v$ = useVuelidate(rules, formData);

// Parse and validate usernames/emails from textarea
function parseUsernamesText() {
  const lines = usernamesText.value?.split("\n") ?? [];
  formData.usersWithData = [];
  try {
    // Validate and parse each line
    lines.forEach((line, index) => {
      // Skip empty lines
      if (line.trim() === "") {
        return;
      }

      const parts = line.split(";").map(part => part.trim());
      const identifier = parts[0]; // Username or email
      const publicName = parts[1] || ""; // Optional public_name
      const individualVoteAmount = parts[2] ? parseInt(parts[2], 10) : null; // Optional vote_amount

      // Validate identifier (username/email)
      if (identifier === "") {
        throw { index, message: `Leerer Benutzername/E-Mail in Zeile ${index + 1}` };
      }

      // Validate email format if tokenBasedLogin is true
      if (formData.tokenBasedLogin && !isValidEmail(identifier)) {
        throw { index, message: `Ungültige E-Mail-Adresse in Zeile ${index + 1}: ${identifier}` };
      }

      // Validate vote amount if provided
      if (individualVoteAmount !== null && (isNaN(individualVoteAmount) || individualVoteAmount < 0)) {
        throw { index, message: `Ungültige Stimmenzahl in Zeile ${index + 1}: ${parts[2]}` };
      }

      // Add valid user to the list
      // Ein Benutzer hat Stimmrecht, wenn eine individuelle Stimmenzahl > 0 angegeben wurde
      formData.usersWithData.push({
        identifier,
        publicName,
        voteAmount: individualVoteAmount,
        allowToVote: individualVoteAmount !== null && individualVoteAmount > 0
      });
    });

    // Update the usernames array for backward compatibility
    formData.usernames = formData.usersWithData.map(user => user.identifier);
    return true;
  } catch (error) {
    handleError(
      new NetworkError(
        error.message || `Die Benutzerliste enthält fehlerhafte Eintragungen in Zeile ${error.index + 1}`,
      ),
    );
    parsedPreview.value = []; // Bei Fehler Vorschau zurücksetzen
    return false;
  }
}

// Event handlers
function onChangeUsernamesText({ value }) {
  usernamesText.value = value;
  updatePreview();
}

// Generiere Vorschau der geparsten Benutzerdaten
function updatePreview() {
  try {
    const lines = usernamesText.value?.split("\n") ?? [];
    const preview = [];
    
    // Verarbeite jede Zeile
    lines.forEach(line => {
      // Überspringe leere Zeilen
      if (line.trim() === "") {
        return;
      }

      const parts = line.split(";").map(part => part.trim());
      const identifier = parts[0]; // Username oder email
      const publicName = parts[1] || ""; // Optional public_name
      const individualVoteAmount = parts[2] ? parseInt(parts[2], 10) : null; // Optional vote_amount
      
      // Validiere den Identifier grob, ohne Fehlermeldung zu werfen
      if (identifier === "") {
        return;
      }
      
      // Validiere Email-Format, aber nur für Vorschau (keine Fehlermeldung)
      if (formData.tokenBasedLogin && !isValidEmail(identifier)) {
        // In der Vorschau zeigen wir ungültige Einträge an, markieren sie aber später ggf.
      }
      
      // Füge gültigen Benutzer zur Vorschau hinzu
      preview.push({
        identifier,
        publicName,
        voteAmount: individualVoteAmount,
        allowToVote: individualVoteAmount !== null && individualVoteAmount > 0
      });
    });
    
    parsedPreview.value = preview;
  } catch (error) {
    console.error("Fehler bei der Vorschau-Generierung", error);
    // Wir zeigen keine Fehlermeldung an, da dies nur die Vorschau ist
  }
}

// Berechne Gesamtstimmen
function getTotalVotes() {
  return parsedPreview.value.reduce((sum, user) => {
    return sum + (user.voteAmount !== null ? user.voteAmount : 0);
  }, 0);
}

async function onSubmit() {
  const parsedSuccessfully = parseUsernamesText();
  const result = await v$.value.$validate();

  if (!result || !parsedSuccessfully) {
    handleError(new InvalidFormError());
    return;
  }

  emit("submit", {
    usernames: formData.usernames,
    tokenBasedLogin: formData.tokenBasedLogin,
    usersWithData: formData.usersWithData // Pass the full user data including public_name and individual vote_amount
  });
}
</script>

<style lang="scss" scoped>
.multiple-event-user-new {
  max-width: 840px;

  .preview-table {
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    padding: 1rem;
    background-color: #f8f9fa;

    h5 {
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .table {
      margin-bottom: 0.5rem;
      
      em {
        color: #6c757d;
        font-style: italic;
      }
    }

    .summary {
      margin-top: 0.5rem;
    }
  }

  .progress-feedback {
    .progress {
      height: 20px;
      background-color: #e9ecef;
      border-radius: 0.25rem;

      .progress-bar {
        min-width: 2em;
        background-color: #0d6efd;
        color: white;
        text-align: center;
        transition: width 0.3s ease;
      }
    }

    .text-muted {
      display: block;
      margin-top: 0.5rem;
      text-align: center;
    }
  }

  .btn {
    min-width: 150px;

    i {
      margin-right: 0.5rem;
    }
  }
}
</style>
