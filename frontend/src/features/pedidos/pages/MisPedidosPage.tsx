import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Cargando } from '../../../shared/components/Cargando'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import type { PedidosPaginados } from '../types/Pedido'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const limite = 20

export function MisPedidosPage() {
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const pedidos = useQuery({
    queryKey: ['pedidos', pagina],
    queryFn: async () => (await axiosInstance.get<PedidosPaginados>('/pedidos', {
      params: { skip: (pagina - 1) * limite, limit: limite },
    })).data,
  })
  const cancelar = useMutation({
    mutationFn: async (id: number) => axiosInstance.patch(`/pedidos/${id}/cancelar`),
    onSuccess: async () => {
      setError('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pedidos'] }),
        queryClient.invalidateQueries({ queryKey: ['productos'] }),
      ])
    },
    onError: (fallo) => setError(handleApiError(fallo)),
  })

  return <div className="space-y-5">
    <h1 className="text-3xl font-bold">Mis pedidos</h1>
    {error && <EstadoError mensaje={error} />}
    {pedidos.isPending && <Cargando mensaje="Cargando pedidos..." />}
    {pedidos.isError && <div className="space-y-2"><EstadoError mensaje={handleApiError(pedidos.error)} />
      <Button onClick={() => void pedidos.refetch()}>Reintentar</Button></div>}
    {pedidos.data?.items.length === 0 && <EstadoVacio mensaje="Todavía no hiciste pedidos." />}
    {pedidos.data?.items.map((pedido) => <Card key={pedido.id} className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="text-lg font-semibold">Pedido #{pedido.id}</h2>
        <span className="font-medium">{pedido.estado.replace('_', ' ')}</span>
      </div>
      <p>Entrega: {pedido.direccion_entrega} · Pago: {pedido.forma_pago}</p>
      {pedido.notas && <p>Notas: {pedido.notas}</p>}
      <ul className="list-inside list-disc text-sm text-slate-700">
        {pedido.items.map((item) => <li key={item.producto_id}>{item.nombre_producto} × {item.cantidad} — {moneda.format(item.subtotal)}</li>)}
      </ul>
      <p className="font-semibold">Total: {moneda.format(pedido.total)}</p>
      {pedido.estado === 'PENDIENTE' && <Button variante="secundaria" disabled={cancelar.isPending}
        onClick={() => cancelar.mutate(pedido.id)}>Cancelar pedido #{pedido.id}</Button>}
    </Card>)}
    {pedidos.data && pedidos.data.total > limite && <nav aria-label="Paginación de pedidos" className="flex justify-center gap-3">
      <Button variante="secundaria" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
      <span>Página {pagina}</span>
      <Button variante="secundaria" disabled={pagina * limite >= pedidos.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
    </nav>}
  </div>
}
