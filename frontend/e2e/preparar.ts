import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

export default function preparar() {
  const backend = resolve(process.cwd(), '../backend')
  const control = resolve(process.cwd(), '../../FOODSTORE_CONTROL/QA/e2e_db.py')
  execFileSync(resolve(backend, '.venv/Scripts/python.exe'), [control, 'preparar'], {
    cwd: backend,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'postgresql://foodstore@localhost:5433/foodstore_test' },
  })
}
