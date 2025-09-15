import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'functions', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React Hooks Rules - Enforce Rules of Hooks
      ...reactHooks.configs.recommended.rules,

      // React Refresh Rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript Rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_ac' }],
      '@typescript-eslint/no-explicit-any': 'off',

      // General Rules
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  }
);
