import { defineConfig, devices } from '@playwright/test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = dirname(fileURLToPath(import.meta.url))
const backend = resolve(frontend, '../backend')
const databaseUrl = 'postgresql://foodstore@localhost:5433/foodstore_test'

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5175',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  globalSetup: './e2e/preparar.ts',
  globalTeardown: './e2e/limpiar.ts',
  webServer: [
    {
      command: `"${resolve(backend, '.venv/Scripts/python.exe')}" -m uvicorn app.main:app --host localhost --port 8002`,
      cwd: backend,
      url: 'http://localhost:8002/api/v1/salud',
      reuseExistingServer: false,
      env: { DATABASE_URL: databaseUrl, FRONTEND_ORIGIN: 'http://localhost:5175' },
      timeout: 30_000,
    },
    {
      command: 'corepack pnpm dev --port 5175 --strictPort',
      cwd: frontend,
      url: 'http://localhost:5175/',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://localhost:8002/api/v1' },
      timeout: 30_000,
    },
  ],
})
