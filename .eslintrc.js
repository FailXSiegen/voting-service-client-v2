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
    "no-multiple-empty-lines": [2, {max: 1, maxEOF: 0}],
    "vue/no-v-html": 0,
    "vue/multi-word-component-names": "off",

    // Quality rules (equivalent to PHPMD)
    complexity: ["warn", 20],
    "max-depth": ["warn", 4],
    "max-lines-per-function": ["warn", {max: 300, skipBlankLines: true, skipComments: true}],
    "max-params": ["warn", 5],
    "max-nested-callbacks": ["warn", 4],
    "no-duplicate-imports": "error",
  },
};
