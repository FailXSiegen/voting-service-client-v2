import {createI18n} from "vue-i18n";
import messages from "@/messages.json";

const l18n = createI18n({
    legacy: false,
    locale: 'de',
    fallbackLocale: 'de',
    messages
});

export default l18n;