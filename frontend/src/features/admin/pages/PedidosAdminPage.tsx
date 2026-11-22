import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Cargando } from '../../../shared/components/Cargando'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import type { Pedido, PedidosPaginados } from '../../pedidos/types/Pedido'
import { AdminPage } from '../components/AdminPage'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const limite = 20

export function PedidosAdminPage() {
  const cliente = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const [error, setError] = useState('')
  const pedidos = useQuery({
    queryKey: ['admin', 'pedidos', pagina, estado],
    queryFn: async () => (await axiosInstance.get<PedidosPaginados>('/pedidos', {
      params: { skip: (pagina - 1) * limite, limit: limite, estado: estado || undefined },
    })).data,
  })
  const actualizar = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: number, nuevoEstado: Pedido['estado'] }) =>
      axiosInstance.patch(`/pedidos/${id}/estado`, { estado: nuevoEstado }),
    onSuccess: async () => {
      setError('')
      await Promise.all([
        cliente.invalidateQueries({ queryKey: ['admin', 'pedidos'] }),
        cliente.invalidateQueries({ queryKey: ['admin', 'resumen'] }),
        cliente.invalidateQueries({ queryKey: ['productos'] }),
        cliente.invalidateQueries({ queryKey: ['admin', 'productos'] }),
        cliente.invalidateQueries({ queryKey: ['pedidos'] }),
      ])
    },
    onError: (fallo) => setError(handleApiError(fallo)),
  })
  function cambiar(id: number, nuevoEstado: Pedido['estado']) {
    if (nuevoEstado === 'CANCELADO' && !window.confirm(`¿Cancelar el pedido #${id}? Se restituirá el stock.`)) return
    actualizar.mutate({ id, nuevoEstado })
  }
  return <AdminPage titulo="Pedidos">
    <label className="block max-w-xs text-sm font-medium">Filtrar por estado
      <select aria-label="Filtrar pedidos por estado" value={estado}
        onChange={(evento) => { setEstado(evento.target.value); setPagina(1) }}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2">
        <option value="">Todos</option><option value="PENDIENTE">Pendientes</option>
        <option value="EN_PREPARACION">En preparación</option><option value="ENTREGADO">Entregados</option>
        <option value="CANCELADO">Cancelados</option>
      </select>
    </label>
    {error && <EstadoError mensaje={error} />}
    {pedidos.isPending && <Cargando mensaje="Cargando pedidos..." />}
    {pedidos.isError && <div className="space-y-2"><EstadoError mensaje={handleApiError(pedidos.error)} />
      <Button onClick={() => void pedidos.refetch()}>Reintentar</Button></div>}
    {pedidos.data?.items.length === 0 && <EstadoVacio mensaje="No hay pedidos para este filtro." />}
    {pedidos.data?.items.map((pedido) => <Card key={pedido.id} className="space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="text-lg font-semibold">Pedido #{pedido.id}</h2>
        <span className="font-medium">{pedido.estado.replace('_', ' ')}</span>
      </div>
      <p>Usuario #{pedido.usuario_id} · {new Date(pedido.created_at).toLocaleString('es-AR')}</p>
      <p>Entrega: {pedido.direccion_entrega} · Pago: {pedido.forma_pago}</p>
      <ul className="list-inside list-disc text-sm text-slate-700">
        {pedido.items.map((item) => <li key={item.producto_id}>{item.nombre_producto} × {item.cantidad}</li>)}
      </ul>
      <p className="font-semibold">Total: {moneda.format(pedido.total)}</p>
      <div className="flex flex-wrap gap-2">
        {pedido.estado === 'PENDIENTE' && <Button disabled={actualizar.isPending}
          onClick={() => cambiar(pedido.id, 'EN_PREPARACION')}>Preparar pedido #{pedido.id}</Button>}
        {pedido.estado === 'EN_PREPARACION' && <Button disabled={actualizar.isPending}
          onClick={() => cambiar(pedido.id, 'ENTREGADO')}>Entregar pedido #{pedido.id}</Button>}
        {(pedido.estado === 'PENDIENTE' || pedido.estado === 'EN_PREPARACION') &&
          <Button variante="secundaria" disabled={actualizar.isPending}
            onClick={() => cambiar(pedido.id, 'CANCELADO')}>Cancelar pedido #{pedido.id}</Button>}
      </div>
    </Card>)}
    {pedidos.data && pedidos.data.total > limite && <nav aria-label="Paginación de pedidos administrativos" className="flex items-center justify-center gap-3">
      <Button variante="secundaria" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
      <span>Página {pagina}</span>
      <Button variante="secundaria" disabled={pagina * limite >= pedidos.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
    </nav>}
  </AdminPage>
}
