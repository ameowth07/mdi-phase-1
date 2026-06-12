import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dir = path.dirname(fileURLToPath(import.meta.url))

// GitHub Pages project sites live at https://<user>.github.io/<repo>/ — assets need this prefix.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = repo ? `/${repo}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@mdi/legacy-ribbon': path.resolve(dir, 'packages/legacy-ribbon/src/index.ts'),
      '@mdi/legacy-ribbon/tokens.css': path.resolve(
        dir,
        'packages/legacy-ribbon/src/tokens.css',
      ),
    },
  },
})
