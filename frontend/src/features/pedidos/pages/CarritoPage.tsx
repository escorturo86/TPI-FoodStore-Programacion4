import { Link } from 'react-router-dom'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function CarritoPage() {
  const items = useCartStore((state) => state.items)
  const quitar = useCartStore((state) => state.quitar)
  const cambiarCantidad = useCartStore((state) => state.cambiarCantidad)
  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)

  return <div className="space-y-5">
    <h1 className="text-3xl font-bold">Carrito</h1>
    {items.length === 0 ? <EstadoVacio mensaje="Tu carrito está vacío.">
      <Link to="/" className="mt-3 inline-block text-emerald-700 underline">Ver catálogo</Link>
    </EstadoVacio> : <>
      <div className="space-y-3">
        {items.map((item) => <Card key={item.producto_id}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="font-semibold">{item.nombre}</h2>
              <p className="text-sm text-slate-600">Precio: {moneda.format(item.precio)}</p></div>
            <label className="text-sm">Cantidad de {item.nombre}
              <input type="number" min={1} max={item.stock} value={item.cantidad}
                onChange={(event) => cambiarCantidad(item.producto_id, Number(event.target.value))}
                className="ml-2 w-20 rounded border border-slate-300 p-2" />
            </label>
            <p>Subtotal: {moneda.format(item.precio * item.cantidad)}</p>
            <Button variante="secundaria" onClick={() => quitar(item.producto_id)}>Quitar {item.nombre}</Button>
          </div>
        </Card>)}
      </div>
      <p className="text-right text-xl font-bold">Total: {moneda.format(total)}</p>
      <div className="flex justify-end"><Link to="/checkout" className="rounded-lg bg-emerald-700 px-4 py-2 text-white">Confirmar pedido</Link></div>
    </>}
  </div>
}
