import { useQuery } from '@tanstack/react-query'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Cargando } from '../../../shared/components/Cargando'
import { EstadoError } from '../../../shared/components/EstadoError'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { AdminPage } from '../components/AdminPage'

interface Resumen {
  pendientes: number
  en_preparacion: number
  entregados: number
  cancelados: number
  pedidos_hoy: number
  ingresos_entregados: number
}

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function ResumenAdminPage() {
  const resumen = useQuery({
    queryKey: ['admin', 'resumen'],
    queryFn: async () => (await axiosInstance.get<Resumen>('/pedidos/resumen')).data,
  })
  const indicadores: [keyof Resumen, string][] = [
    ['pendientes', 'Pendientes'], ['en_preparacion', 'En preparación'],
    ['entregados', 'Entregados'], ['cancelados', 'Cancelados'],
    ['pedidos_hoy', 'Pedidos de hoy'], ['ingresos_entregados', 'Ingresos entregados'],
  ]
  return <AdminPage titulo="Administración">
    {resumen.isPending && <Cargando mensaje="Cargando resumen..." />}
    {resumen.isError && <div className="space-y-2"><EstadoError mensaje={handleApiError(resumen.error)} />
      <Button onClick={() => void resumen.refetch()}>Reintentar</Button></div>}
    {resumen.data && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indicadores.map(([clave, etiqueta]) => <Card key={clave}>
        <h2 className="text-sm text-slate-600">{etiqueta}</h2>
        <p className="mt-2 text-3xl font-bold">{clave === 'ingresos_entregados'
          ? moneda.format(resumen.data[clave]) : resumen.data[clave]}</p>
      </Card>)}
    </div>}
  </AdminPage>
}
