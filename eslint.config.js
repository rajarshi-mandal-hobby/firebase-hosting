import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        ignores: ['dist', 'functions', 'node_modules']
    },
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.es2022 }
            // React 19 + TS handles JSX/parsing automatically via tseslint
        },
        plugins: {
            react,
            'react-hooks': reactHooks
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules, // Standard hooks rules

            // TypeScript/General Overrides
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off' // Not needed in TS
        },
        settings: {
            react: { version: 'detect' }
        }
    }
]);
