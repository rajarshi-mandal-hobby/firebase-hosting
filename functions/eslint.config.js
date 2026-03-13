import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    // 1. Global Ignores
    {
        ignores: ['lib', 'node_modules']
    },

    // 2. Base Recommended Configs
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // 3. Functions Specific Config
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            },
            globals: {
                ...globals.node,
                ...globals.es2024
            }
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin
        },
        rules: {
            // Firebase specific best practices
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-console': 'off', // Cloud functions rely on console logs for logging

            // Node 24 / ESM enforcement
            'prefer-const': 'error',
            'no-var': 'error',
            'arrow-body-style': ['error', 'as-needed']
        }
    }
]);
