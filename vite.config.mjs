import { fileURLToPath, URL } from 'node:url';
import { dirname } from 'node:path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteStaticCopy } from 'vite-plugin-static-copy';
// TODO remove me with bootstrap 5
import inject from '@rollup/plugin-inject';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    allowedHosts: ['local.digitalwahl.org', 'localhost', '127.0.0.1'],
  },
  plugins: [
    // Currently we only use this for bootstrap 4 modal because this requires jquery to have control over them modal.
    // TODO remove me with bootstrap 5
    inject({
      $: 'jquery',
      jQuery: 'jquery',
      include: ['.js', '.vue', '.mjs'],
    }),
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@zoom/meetingsdk/dist/lib',
          rename: { stripBase: 4 },
          dest: __dirname + '/dist/lib/zoom/',
        },
        {
          src: 'node_modules/@zoom/meetingsdk/dist/lib',
          rename: { stripBase: 4 },
          dest: __dirname + '/public/lib/zoom/',
        },
        {
          src: 'node_modules/@zoom/meetingsdk/dist/ui',
          rename: { stripBase: 4 },
          dest: __dirname + '/dist/lib/zoom/',
        },
        {
          src: 'node_modules/@zoom/meetingsdk/dist/ui',
          rename: { stripBase: 4 },
          dest: __dirname + '/public/lib/zoom/',
        },
        {
          src: 'src/assets/pdf',
          rename: { stripBase: 2 },
          dest: __dirname + '/dist/download',
        },
        {
          src: 'src/assets/pdf',
          rename: { stripBase: 2 },
          dest: __dirname + '/public/download',
        },
        {
          src: 'src/messages.json',
          rename: { stripBase: 1 },
          dest: __dirname + '/dist/src/',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
  build: {
    // vue3-easy-data-table ships CSS that the default lightningcss minifier rejects.
    cssMinify: 'esbuild',
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});
