import { createApp, provide, h } from "vue";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { apolloClient } from "./apollo-client";
import App from "./App.vue";
import { router } from "./router/router";
import i18n from "./l18n";
import { createHead } from "@vueuse/head";
import { version } from "./../package";
import { createApolloProvider } from "@vue/apollo-option";
import * as ConfirmDialog from "vuejs-confirm-dialog";
import Vue3EasyDataTable from "vue3-easy-data-table";
import VueDatePicker from "@vuepic/vue-datepicker";
import { createPinia } from "pinia";
import jQuery from 'jquery';
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
app.use(i18n);
app.use(apolloProvider);
app.use(head);
app.use(ConfirmDialog);
app.provide("appVersion", version);
app.component("EasyDataTable", Vue3EasyDataTable);
app.component("VueDatePicker", VueDatePicker);
app.mount("#app");