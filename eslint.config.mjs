import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()

export default antfu(
  {
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
      toml: 'dprint',
      typescript: true,
    },
    ignores: [
      '.output/**',
      '.wxt/**',
      'coverage/**',
      'public/**',
    ],
    react: true,
    typescript: {
      tsconfigPath: './tsconfig.json',
    },
  },
  {
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      'import/no-mutable-exports': 'warn',
      'no-console': 'off',
      'react/no-create-ref': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'ts/promise-function-async': 'off',
      'ts/strict-boolean-expressions': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'test/prefer-lowercase-title': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    rules: {
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-unsafe-return': 'off',
    },
  },
  ...compat.config({
    env: {
      webextensions: true,
    },
  }),
)
