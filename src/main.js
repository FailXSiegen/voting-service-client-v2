import {createApp, provide, h} from "vue";
import {DefaultApolloClient} from "@vue/apollo-composable";
import {apolloClient} from "./apollo-client";
import App from "./App.vue";
import {router} from "./router/router";
import i18n from "./l18n";
import store from "./store";
import {createHead} from "@vueuse/head";
import {version} from './../package';
import {createApolloProvider} from '@vue/apollo-option';

import 'vue3-toastify/dist/index.css';
import "bootstrap";
import "./scss/main.scss";

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
app.use(store);
app.use(i18n);
app.use(apolloProvider);
app.use(head);
app.provide('appVersion', version);
app.mount("#app");
