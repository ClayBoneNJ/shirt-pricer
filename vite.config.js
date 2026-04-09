import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const packageVersionParts = packageJson.version.split('.').map((part) => Number.parseInt(part, 10) || 0)
const displayVersionNumber = packageVersionParts[0] * 10000 + packageVersionParts[1] * 100 + packageVersionParts[2]

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(`v${String(displayVersionNumber).padStart(3, '0')}`),
  },
  plugins: [react()],
})
