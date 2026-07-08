// ESLint flat config (ESLint 9 + typescript-eslint 8).
// Mirrors the previous .eslintrc.json: recommended JS + TS rules, strict on
// no-console/no-debugger, lenient on the legacy codebase's `any` usage
// (tightened by the Phase 4 typing work and future strict-mode pass).
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/', 'www/', 'loader/', 'node_modules/', 'src/components.d.ts', '**/*.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      'no-console': 'error',
      'no-debugger': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^h$|^Fragment$' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.spec.{ts,tsx}', '**/*.e2e.ts'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  }
)
