const tseslint = require('@typescript-eslint/eslint-plugin');
module.exports = [
  { files: ['src/**/*.ts'], languageOptions: { parser: require('@typescript-eslint/parser') }, plugins: { '@typescript-eslint': tseslint }, rules: {} },
];
