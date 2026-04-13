<template>
  <div id="jitsi-root" ref="jitsiContainer" />
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';

const emit = defineEmits(['loaded']);
const jitsiContainer = ref(null);
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
  const domain = props.serverUrl.replace(/^https?:\/\//, '');

  try {
    await loadJitsiScript(domain);
  } catch (error) {
    console.error('Failed to load Jitsi external API:', error);
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
