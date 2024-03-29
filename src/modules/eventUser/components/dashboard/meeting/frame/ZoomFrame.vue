<template>
  <div class="iframe-container" />
</template>

<script setup>
import { onMounted, ref } from "vue";
import { setCookie } from "@/core/util/cookie";
import { fetchSignature } from "@/modules/eventUser/requests/fetch-zoom-signature";

const emit = defineEmits(["loaded"]);
const meetConfig = ref({});
const ZoomMeeting = ref(null);

const props = defineProps({
  sdkKey: {
    type: String,
    required: true,
  },
  sdkSecret: {
    type: String,
    required: true,
  },
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
  const { ZoomMtg } = await import("@zoomus/websdk");
  ZoomMeeting.value = ZoomMtg;
  document.getElementById("zmmtg-root").style.display = "block";
  // @see vite.config.js
  ZoomMeeting.value.setZoomJSLib("/lib/zoom/lib", "/av");
  ZoomMeeting.value?.preLoadWasm();
  ZoomMeeting.value?.prepareJssdk();
  // loads language files, also passes any error messages to the ui
  ZoomMeeting.value?.i18n.load("de-DE");
  ZoomMeeting.value?.i18n.reload("de-DE");

  // Meeting config object
  meetConfig.value = {
    sdkKey: props.sdkKey,
    sdkSecret: props.sdkSecret,
    meetingNumber: props.meetingNumber,
    userName: props.nickname,
    passWord: props.password,
    leaveUrl: props.returnUrl,
    role: 0,
    lang: "de-DE",
    china: false,
    userEmail: "",
  };
  setCookie("meeting_number", props.meetingNumber);
  setCookie("meeting_pwd", props.password);

  // Mark as loaded here because the overlay already exist at this point.
  emit("loaded");

  // Generate Signature.
  const { signature } = await fetchSignature(meetConfig.value?.meetingNumber);
  meetConfig.value.signature = signature;

  join();
});

function join() {
  ZoomMeeting.value?.init({
    leaveUrl: meetConfig.value?.leaveUrl,
    webEndpoint: meetConfig.value?.webEndpoint,
    success: () => {
      ZoomMeeting.value?.i18n.load(meetConfig.value?.lang);
      ZoomMeeting.value?.i18n.reload(meetConfig.value?.lang);
      ZoomMeeting.value?.join({
        sdkKey: meetConfig.value?.sdkKey,
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
