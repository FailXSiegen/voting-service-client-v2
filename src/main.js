import {createApp} from "vue";
import App from "./App.vue";
import {router} from "./router/router";
import i18n from "./l18n";
import store from "./store";
import {createHead} from "@vueuse/head"
import {version} from './../package';

import "./scss/main.scss"
import "bootstrap"

const app = createApp(App);
const head = createHead()

app.use(store);
app.use(i18n);
app.use(router);
app.use(head)
app.provide('appVersion', version)
app.mount("#app");
