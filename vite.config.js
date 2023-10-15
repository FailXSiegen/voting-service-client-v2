import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
// TODO remove me with bootstrap 5
import inject from "@rollup/plugin-inject";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Currently we only use this for bootstrap 4 modal because this requires jquery to have control over them modal.
    // TODO remove me with bootstrap 5
    inject({
      $: "jquery",
      jQuery: "jquery",
      include: [".js", ".vue", ".mjs"],
    }),
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: __dirname + "/node_modules/@zoomus/websdk/dist/lib",
          dest: __dirname + "/dist/lib/zoom/",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "vue-i18n": "vue-i18n/dist/vue-i18n.cjs.js",
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
  },
});
