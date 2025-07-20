import { createApp, provide, h } from "vue";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { apolloClient } from "./apollo-client";
import App from "./App.vue";
import { router } from "./router/router";
import l18n, { reloadTranslations, translationsLoaded } from './l18n';
import { createHead } from "@vueuse/head";
import { version } from "./../package";
import { createApolloProvider } from "@vue/apollo-option";
import * as ConfirmDialog from "vuejs-confirm-dialog";
import Vue3EasyDataTable from "vue3-easy-data-table";
import VueDatePicker from "@vuepic/vue-datepicker";
import { createPinia } from "pinia";
import jQuery from "jquery";
import Vue3Toastify, { toast } from 'vue3-toastify';
import { watch } from 'vue';
window.$ = window.jQuery = jQuery;

import "vue3-easy-data-table/dist/style.css";
import "vue3-toastify/dist/index.css";
import "bootstrap";
import "./scss/main.scss";
import "@vuepic/vue-datepicker/dist/main.css";

const apolloProvider = createApolloProvider({
  defaultClient: apolloClient,
});

const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },
  render: () => h(App),
});
const head = createHead();

app.use(router);
app.use(createPinia());
app.use(l18n);
app.use(apolloProvider);
app.use(head);
app.use(ConfirmDialog);
app.use(Vue3Toastify, {
  autoClose: 3000,
  clearOnUrlChange: true,
  hideProgressBar: false,
  position: "top-right",
  pauseOnHover: true,
  pauseOnFocusLoss: false
});

app.provide("appVersion", version);
app.component("EasyDataTable", Vue3EasyDataTable);
app.component("VueDatePicker", VueDatePicker);

// Füge einen globalen Router-Guard hinzu
router.beforeEach(async (to, from, next) => {
  // Wenn wir nach dem Login zu einer anderen Route wechseln, Übersetzungen neu laden
  if (from.path !== to.path && !translationsLoaded.value) {
    try {
      await reloadTranslations();
    } catch (error) {
      console.error('[router] Error loading translations:', error);
    }
  }

  next();
});

// Warte auf die erste Übersetzungsladung, bevor die App gemountet wird
if (translationsLoaded.value) {
  app.mount('#app');
} else {
  watch(translationsLoaded, (isLoaded) => {
    if (isLoaded) {
      app.mount('#app');
    }
  });

  // Fallback: Mount nach Timeout, falls Übersetzungen nicht geladen werden können
  setTimeout(() => {
    if (!translationsLoaded.value) {
      app.mount('#app');
    }
  }, 5000);
}