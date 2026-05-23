import eslintJs from '@eslint/js';
import { defineConfig } from 'eslint/config'; // New ESLint 10 native helper
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        ignores: ['dist/**', 'node_modules/**', '.vscode/'],
    },
    eslintJs.configs.recommended,
    tseslint.configs.recommended,
    eslintReact.configs['recommended-typescript'],
    reactHooks.configs.flat['recommended-latest'],
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            ...reactHooks.configs.flat['recommended-latest'].rules,

            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
            'react/prop-types': 'off',
        },
        settings: {
            react: {
                version: '19',
            },
        },
    },
]);
