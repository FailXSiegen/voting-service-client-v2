<template>
  <div v-if="enabled" ref="box" class="mb-3">
    <div :id="boxId" />
    <p v-if="loadFailed" class="text-danger small mt-2">
      Die Spam-Prüfung konnte nicht geladen werden. Bitte laden Sie die Seite neu.
    </p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { SYSTEM_SETTINGS_QUERY } from '@/modules/organizer/graphql/queries/system-settings';
import { allowedMosparoHosts, whitelistedHost } from '@/core/util/allowed-hosts';

const DEFAULT_HOST = 'captcha.failx.de';
const emit = defineEmits(['change', 'ready']);
const boxId = 'mosparo-box';
const box = ref(null);
const loadFailed = ref(false);
const invisible = ref(false);
let scriptTag = null;

const { result } = useQuery(SYSTEM_SETTINGS_QUERY, {}, { fetchPolicy: 'network-only' });
const settings = computed(() => result.value?.systemSettings);
const enabled = computed(() => Boolean(settings.value?.mosparoEnabled));

function start() {
  // The host comes from the system settings: only load the script from whitelisted hosts.
  const allowedHost = whitelistedHost(
    settings.value.mosparoHost || DEFAULT_HOST,
    allowedMosparoHosts()
  );
  if (!allowedHost) {
    console.error('mosparo host is not whitelisted:', settings.value.mosparoHost);
    loadFailed.value = true;
    return;
  }
  const host = `https://${allowedHost}`;
  scriptTag = document.createElement('script');
  scriptTag.src = `${host}/build/mosparo-frontend.js`;
  scriptTag.onerror = () => (loadFailed.value = true);
  scriptTag.onload = () =>
    new window.mosparo(boxId, host, settings.value.mosparoUuid, settings.value.mosparoPublicKey, {
      loadCssResource: true,
      onCheckForm: (valid) => emit('change', valid),
      onResetState: () => emit('change', false),
      onSwitchToInvisible: () => {
        invisible.value = true;
        emit('change', true);
      },
      // Invisible mode checks on submit, after our own submit handler already ran.
      doSubmitFormInvisible: () => emit('ready'),
    });
  document.head.appendChild(scriptTag);
}

watch(
  settings,
  (value) => {
    if (!value || scriptTag) return;
    if (!value.mosparoEnabled) return emit('change', true);
    setTimeout(start);
  },
  { immediate: true }
);

// mosparo writes its tokens as hidden fields into the surrounding form.
function getTokens() {
  const form = box.value?.closest('form');
  return {
    mosparoSubmitToken: form?.querySelector('[name="_mosparo_submitToken"]')?.value,
    mosparoValidationToken: form?.querySelector('[name="_mosparo_validationToken"]')?.value,
  };
}

onBeforeUnmount(() => scriptTag?.remove());
// True while invisible mode still has to check the form; `ready` follows once it passed.
const isPending = () => invisible.value && !getTokens().mosparoValidationToken;

defineExpose({ getTokens, isPending });
</script>
