import { Card } from '../../../shared/ui/Card'
import { useAuthStore } from '../../../store/authStore'

export function MiCuentaPage() {
  const usuario = useAuthStore((state) => state.usuario)

  return (
    <Card className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Usuario</dt><dd>{usuario?.username}</dd></div>
        <div><dt className="text-sm text-slate-500">Nombre</dt><dd>{usuario?.full_name}</dd></div>
        <div><dt className="text-sm text-slate-500">Correo</dt><dd>{usuario?.email}</dd></div>
        <div><dt className="text-sm text-slate-500">Rol</dt><dd>{usuario?.role}</dd></div>
      </dl>
    </Card>
  )
}
