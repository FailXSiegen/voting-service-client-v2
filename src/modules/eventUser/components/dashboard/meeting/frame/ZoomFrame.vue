<template>
  <div class="iframe-container" />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { setCookie } from '@/core/util/cookie';
import { fetchSignature } from '@/modules/eventUser/requests/fetch-zoom-signature';

const emit = defineEmits(['loaded']);

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
const meetConfig = ref({});
const ZoomMeeting = ref(null);

const props = defineProps({
  nickname: {
    type: String,
    required: true,
  },
  meetingNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  returnUrl: {
    type: String,
    required: true,
  },
});

onMounted(async () => {
  const { ZoomMtg } = await import('@zoom/meetingsdk');
  ZoomMeeting.value = ZoomMtg;
  // @see vite.config.mjs
  ZoomMeeting.value.setZoomJSLib('/lib/zoom/lib', '/av');
  ZoomMeeting.value?.preLoadWasm();
  ZoomMeeting.value?.prepareWebSDK();

  // prepareWebSDK creates #zmmtg-root asynchronously, wait for it
  const zmmtgRoot = await waitForElement('#zmmtg-root');
  if (zmmtgRoot) {
    zmmtgRoot.style.display = 'block';
  }
  // loads language files, also passes any error messages to the ui
  ZoomMeeting.value?.i18n.load('de-DE');
  ZoomMeeting.value?.i18n.reload('de-DE');

  // Meeting config object
  meetConfig.value = {
    meetingNumber: props.meetingNumber,
    userName: props.nickname,
    passWord: props.password,
    leaveUrl: props.returnUrl,
    role: 0,
    lang: 'de-DE',
    china: false,
    userEmail: '',
  };
  setCookie('meeting_number', props.meetingNumber);
  setCookie('meeting_pwd', props.password);

  // Mark as loaded here because the overlay already exist at this point.
  emit('loaded');

  // Generate Signature.
  const { signature } = await fetchSignature(meetConfig.value?.meetingNumber);
  meetConfig.value.signature = signature;

  join();
});

function join() {
  ZoomMeeting.value?.init({
    leaveUrl: meetConfig.value?.leaveUrl,
    patchJsMedia: true,
    success: () => {
      ZoomMeeting.value?.i18n.load(meetConfig.value?.lang);
      ZoomMeeting.value?.i18n.reload(meetConfig.value?.lang);
      ZoomMeeting.value?.join({
        signature: meetConfig.value?.signature,
        meetingNumber: meetConfig.value?.meetingNumber,
        passWord: meetConfig.value?.passWord,
        userName: meetConfig.value?.userName,
        userEmail: meetConfig.value?.userEmail,
        success: function () {
          ZoomMeeting.value?.getAttendeeslist({});
          ZoomMeeting.value?.getCurrentUser();
        },
        error: function (error) {
          console.error(error);
        },
      });
    },
    error: function (error) {
      console.error(error);
    },
  });
}
</script>

<style>
#zmmtg-root {
  display: none;
}
</style>
