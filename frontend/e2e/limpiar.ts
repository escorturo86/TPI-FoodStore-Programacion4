import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

export default function limpiar() {
  const backend = resolve(process.cwd(), '../backend')
  const script = resolve(process.cwd(), 'e2e/e2e_db.py')
  const python = resolve(backend, process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python')
  execFileSync(python, [script, 'limpiar'], {
    cwd: backend,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'postgresql://foodstore@localhost:5433/foodstore_test' },
  })
}
