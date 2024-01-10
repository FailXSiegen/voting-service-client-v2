/* eslint-env node */
module.exports = {
  env: {
    node: true,
  },
  root: true,
  extends: ["eslint:recommended", "plugin:vue/vue3-recommended", "prettier"],
  overrides: [
    {
      files: ["cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}"],
      extends: ["plugin:cypress/recommended"],
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    semi: [2, "always"],
    "no-multiple-empty-lines": [2, { max: 1, maxEOF: 0 }],
    indent: ["error", 2],
    "vue/no-v-html": 0,
  },
};
