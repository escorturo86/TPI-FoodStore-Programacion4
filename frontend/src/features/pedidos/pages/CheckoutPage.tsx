import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import { useCartStore } from '../../../store/cartStore'
import type { Pedido } from '../types/Pedido'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const vaciar = useCartStore((state) => state.vaciar)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const compra = useMutation({
    mutationFn: async (datos: { direccion: string, pago: 'EFECTIVO' | 'TRANSFERENCIA', notas: string }) =>
      (await axiosInstance.post<Pedido>('/pedidos', {
        items: items.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad })),
        direccion_entrega: datos.direccion,
        forma_pago: datos.pago,
        notas: datos.notas.trim() || null,
      })).data,
  })

  const form = useForm({
    defaultValues: { direccion: '', pago: 'EFECTIVO' as 'EFECTIVO' | 'TRANSFERENCIA', notas: '' },
    onSubmit: async ({ value }) => {
      setError('')
      try {
        await compra.mutateAsync({ direccion: value.direccion.trim(), pago: value.pago, notas: value.notas })
        vaciar()
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['pedidos'] }),
          queryClient.invalidateQueries({ queryKey: ['productos'] }),
        ])
        navigate('/mis-pedidos')
      } catch (fallo) {
        setError(handleApiError(fallo))
      }
    },
  })

  if (items.length === 0) return <EstadoVacio mensaje="Tu carrito está vacío.">
    <Link to="/" className="mt-3 inline-block text-emerald-700 underline">Ver catálogo</Link>
  </EstadoVacio>

  return <Card className="mx-auto max-w-2xl">
    <h1 className="text-2xl font-bold">Confirmar pedido</h1>
    <p className="mt-2">{items.length} productos distintos · Total estimado: {moneda.format(items.reduce((suma, item) => suma + item.precio * item.cantidad, 0))}</p>
    <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void form.handleSubmit() }}>
      <form.Field name="direccion" validators={{ onChange: ({ value }) => value.trim().length >= 5 && value.trim().length <= 200
        ? undefined : 'La dirección debe tener entre 5 y 200 caracteres' }}>
        {(field) => <Input id="checkout-direccion" etiqueta="Dirección de entrega" required minLength={5} maxLength={200}
          value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)}
          error={field.state.meta.isTouched ? field.state.meta.errors.map(String).join(', ') : ''} />}
      </form.Field>
      <form.Field name="pago">
        {(field) => <label className="block text-sm font-medium">Forma de pago
          <select value={field.state.value} onChange={(event) => field.handleChange(event.target.value as 'EFECTIVO' | 'TRANSFERENCIA')}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2">
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select></label>}
      </form.Field>
      <form.Field name="notas">
        {(field) => <label className="block text-sm font-medium">Notas (opcional)
          <textarea value={field.state.value} onChange={(event) => field.handleChange(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2" rows={3} /></label>}
      </form.Field>
      {error && <EstadoError mensaje={error} />}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Comprar'}</Button>}
      </form.Subscribe>
    </form>
  </Card>
}
