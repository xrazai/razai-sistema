import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import svelte from 'eslint-plugin-svelte'
import ts from 'typescript-eslint'
import svelteConfig from './svelte.config.js'

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'out/**',
      'node_modules/**',
      'native/**',
      'resources/**',
      'test-results/**',
      'playwright-report/**',
      'coverage/**'
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  {
    files: ['**/*.ts', '**/*.svelte'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      'no-useless-assignment': 'warn',
      'prefer-const': 'warn',
      'svelte/no-unused-svelte-ignore': 'warn',
      'svelte/prefer-svelte-reactivity': 'warn',
      'svelte/require-each-key': 'warn'
    }
  },
  {
    files: ['**/*.svelte'],
    rules: {
      // Svelte 5 uses `let { ... } = $props()` for reactive props.
      'prefer-const': 'off'
    }
  }
])
