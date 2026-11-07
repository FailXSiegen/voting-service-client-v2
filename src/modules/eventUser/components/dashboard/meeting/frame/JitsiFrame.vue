<template>
  <div v-if="loadError" class="alert alert-danger m-3" role="alert">
    {{ loadError }}
  </div>
  <div v-else id="jitsi-root" ref="jitsiContainer" />
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { allowedJitsiHosts, whitelistedHost } from '@/core/util/allowed-hosts';

const emit = defineEmits(['loaded']);
const jitsiContainer = ref(null);
const loadError = ref(null);
let api = null;

const props = defineProps({
  serverUrl: {
    type: String,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  returnUrl: {
    type: String,
    required: true,
  },
});

function loadJitsiScript(domain) {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  // The server URL is free text of the organizer: only load scripts from whitelisted hosts.
  const domain = whitelistedHost(props.serverUrl, allowedJitsiHosts());
  if (!domain) {
    console.error('Jitsi server is not whitelisted:', props.serverUrl);
    loadError.value =
      'Die Videokonferenz kann nicht geladen werden: Der Jitsi-Server ist nicht freigegeben. Bitte wenden Sie sich an den Veranstalter.';
    return;
  }

  try {
    await loadJitsiScript(domain);
  } catch (error) {
    console.error('Failed to load Jitsi external API:', error);
    loadError.value = 'Die Videokonferenz konnte nicht geladen werden.';
    return;
  }

  api = new window.JitsiMeetExternalAPI(domain, {
    roomName: props.roomName,
    parentNode: jitsiContainer.value,
    width: '100%',
    height: '100%',
    userInfo: {
      displayName: props.nickname,
    },
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      prejoinPageEnabled: false,
      lang: 'de',
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DEFAULT_BACKGROUND: '#1a1a2e',
    },
  });

  api.addListener('videoConferenceJoined', () => {
    emit('loaded');
  });

  api.addListener('readyToClose', () => {
    window.location.href = props.returnUrl;
  });
});

onBeforeUnmount(() => {
  if (api) {
    api.dispose();
    api = null;
  }
});
</script>

<style>
#jitsi-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: #1a1a2e;
}

#jitsi-root iframe {
  width: 100% !important;
  height: 100% !important;
  border: none;
}

#jitsi-root.hidden {
  display: none;
}
</style>
