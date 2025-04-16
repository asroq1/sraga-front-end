import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'node_modules/**'],
  },
]
