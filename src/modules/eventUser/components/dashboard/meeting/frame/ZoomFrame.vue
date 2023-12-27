<template>
  <div class="iframe-container" />
</template>

<script setup>
import { onMounted, ref } from "vue";
import { setCookie } from "@/core/util/cookie";

const emit = defineEmits(["loaded"]);
const meetConfig = ref({});
const ZoomMeeting = ref(null);
const signature = ref(null);

const props = defineProps({
  apiKey: {
    type: String,
    required: true,
  },
  apiSecret: {
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
    apiKey: props.apiKey,
    apiSecret: props.apiSecret,
    meetingNumber: props.meetingId,
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

  // Generate Signature function
  signature.value = ZoomMeeting.value?.generateSDKSignature({
    meetingNumber: meetConfig.value?.meetingNumber,
    sdkKey: meetConfig.value?.apiKey,
    sdkSecret: meetConfig.value?.apiSecret,
    role: meetConfig.value?.role,
    success: function (res) {
      join(res);
    },
  });
});

function join(res) {
  meetConfig.value.signature = res.result;
  ZoomMeeting.value?.init({
    leaveUrl: meetConfig.value?.leaveUrl,
    webEndpoint: meetConfig.value?.webEndpoint,
    success: () => {
      ZoomMeeting.value?.i18n.load(meetConfig.value?.lang);
      ZoomMeeting.value?.i18n.reload(meetConfig.value?.lang);

      // client.join({
      //    sdkKey: sdkKey,
      //    signature: signature,
      //    meetingNumber: meetingNumber,
      //    password: password,
      //    userName: userName
      // })

      ZoomMeeting.value?.join({
        sdkKey: meetConfig.value?.apiKey,
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
