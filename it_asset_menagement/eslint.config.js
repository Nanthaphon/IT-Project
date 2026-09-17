import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // argsIgnorePattern: พารามิเตอร์ที่เป็นคอมโพเนนต์ (เช่น { icon: Icon }) ถูกใช้ใน JSX
      // ซึ่ง base rule มองไม่เห็น -> ไม่งั้นจะฟ้อง unused ทั้งที่ใช้อยู่
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
    },
  },

  /* โค้ดฝั่ง Node — Vercel functions, Firebase functions และสคริปต์
     เดิมถูก lint ด้วย globals.browser อย่างเดียว ทำให้ process/Buffer/console
     ขึ้น no-undef 22 จุด = lint ไม่ได้ช่วยตรวจส่วนที่จัดการรหัสผ่านและ token เลย */
  {
    files: ['api/**/*.js', 'functions/**/*.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
