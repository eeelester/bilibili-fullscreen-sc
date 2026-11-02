const antfu = require('@antfu/eslint-config').default
const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat()


module.exports = antfu(
  {
    formatters: {
      css: true, // by default use Prettier
      html: true, // by default use Prettier
      toml: 'dprint', // use dprint for TOML
      markdown: 'prettier', // use prettier for markdown
      typescript: true
    },
    react: true,
    typescript: {
      tsconfigPath: './tsconfig.json'
    },
    ignores: [
      '*.config.js',
      '*.config.ts',
      'tests/**',
      'public/**'
    ]
  },
  {
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "no-console": "off",
      "import/no-mutable-exports": "warn"
    },
  },
  {
    files: ['entrypoints/**/*.content/index.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  ...compat.config({
    env: {
      "webextensions": true
    }
  })
)
