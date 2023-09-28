import {fileURLToPath, URL} from "node:url";

import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import {viteStaticCopy} from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        viteStaticCopy({
            targets: [
                {
                    src: __dirname + '/node_modules/@zoomus/websdk/dist/lib',
                    dest: __dirname + '/dist/lib/zoom/'
                }
            ]
        })
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js'
        },
    },
    test: {
        globals: true,
        environment: 'happy-dom',
    }
});
