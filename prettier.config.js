/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'always',
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  bracketSpacing: true,
  bracketSameLine: false,
};

export default config;
