import { Link } from 'react-router-dom'
import { Card } from '../../../shared/ui/Card'

export function UnauthorizedPage() {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <h1 className="text-2xl font-bold">Acceso denegado</h1>
      <p className="mt-3 text-slate-600">Tu cuenta no tiene permiso para entrar a esta página.</p>
      <Link to="/" className="mt-4 inline-block text-emerald-700 underline">Volver al inicio</Link>
    </Card>
  )
}
