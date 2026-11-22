import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Cargando } from '../../../shared/components/Cargando'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { Input } from '../../../shared/ui/Input'
import type { Categoria, Producto, ProductosPaginados } from '../../productos/types/Producto'
import { AdminPage } from '../components/AdminPage'
import { TablaAdmin } from '../components/TablaAdmin'

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const limite = 20

function ProductoForm({ producto, categorias, cerrar, actualizado }: {
  producto: Producto | null, categorias: Categoria[], cerrar: () => void, actualizado: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const form = useForm({
    defaultValues: {
      categoria_id: producto?.categoria_id ?? categorias[0]?.id ?? 0,
      nombre: producto?.nombre ?? '', descripcion: producto?.descripcion ?? '',
      precio_base: producto?.precio_base ?? 0, imagen_url: producto?.imagen_url ?? '',
      stock: producto?.stock ?? 0, disponible: producto?.disponible ?? true,
    },
    onSubmit: async ({ value }) => {
      setError('')
      try {
        const datos = { ...value, nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null,
          imagen_url: value.imagen_url.trim() || null }
        if (producto) await axiosInstance.put(`/productos/${producto.id}`, datos)
        else await axiosInstance.post('/productos', datos)
        await actualizado()
        cerrar()
      } catch (fallo) { setError(handleApiError(fallo)) }
    },
  })
  return <Card>
    <h2 className="text-xl font-semibold">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(evento) => { evento.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="nombre" validators={{ onChange: ({ value }) => value.trim().length >= 2 && value.trim().length <= 150
        ? undefined : 'El nombre debe tener entre 2 y 150 caracteres' }}>
        {(campo) => <Input id="producto-nombre" etiqueta="Nombre" required minLength={2} maxLength={150}
          value={campo.state.value} onBlur={campo.handleBlur} onChange={(evento) => campo.handleChange(evento.target.value)}
          error={campo.state.meta.isTouched ? campo.state.meta.errors.map(String).join(', ') : ''} />}
      </form.Field>
      <form.Field name="categoria_id">{(campo) => <label className="block text-sm font-medium">Categoría
        <select aria-label="Categoría del producto" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"
          value={campo.state.value} onChange={(evento) => campo.handleChange(Number(evento.target.value))}>
          {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
        </select></label>}</form.Field>
      <form.Field name="descripcion">{(campo) => <Input id="producto-descripcion" etiqueta="Descripción"
        value={campo.state.value} onChange={(evento) => campo.handleChange(evento.target.value)} />}</form.Field>
      <form.Field name="precio_base" validators={{ onChange: ({ value }) => Number.isFinite(value) && value >= 0
        ? undefined : 'El precio debe ser mayor o igual a cero' }}>
        {(campo) => <Input id="producto-precio" etiqueta="Precio" type="number" min={0} step="0.01" required
          value={campo.state.value} onChange={(evento) => campo.handleChange(Number(evento.target.value))}
          error={campo.state.meta.errors.map(String).join(', ')} />}
      </form.Field>
      <form.Field name="imagen_url">{(campo) => <Input id="producto-imagen" etiqueta="Ruta o URL de imagen"
        value={campo.state.value} onChange={(evento) => campo.handleChange(evento.target.value)} />}</form.Field>
      <form.Field name="stock" validators={{ onChange: ({ value }) => Number.isInteger(value) && value >= 0
        ? undefined : 'El stock debe ser un entero no negativo' }}>
        {(campo) => <Input id="producto-stock" etiqueta="Stock" type="number" min={0} step={1} required
          value={campo.state.value} onChange={(evento) => campo.handleChange(Number(evento.target.value))}
          error={campo.state.meta.errors.map(String).join(', ')} />}
      </form.Field>
      <form.Field name="disponible">{(campo) => <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={campo.state.value} onChange={(evento) => campo.handleChange(evento.target.checked)} />
        Disponible para comprar</label>}</form.Field>
      <div className="sm:col-span-2">{error && <EstadoError mensaje={error} />}</div>
      <div className="flex gap-2 sm:col-span-2"><form.Subscribe selector={(estado) => [estado.canSubmit, estado.isSubmitting] as const}>
        {([puede, guardando]) => <Button type="submit" disabled={!puede || guardando || categorias.length === 0}>Guardar producto</Button>}
      </form.Subscribe><Button type="button" variante="secundaria" onClick={cerrar}>Cerrar</Button></div>
    </form>
  </Card>
}

export function ProductosAdminPage() {
  const cliente = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [edicion, setEdicion] = useState<Producto | null | undefined>(undefined)
  const [error, setError] = useState('')
  const categorias = useQuery({ queryKey: ['categorias'],
    queryFn: async () => (await axiosInstance.get<Categoria[]>('/categorias')).data })
  const productos = useQuery({ queryKey: ['admin', 'productos', pagina, busqueda],
    queryFn: async () => (await axiosInstance.get<ProductosPaginados>('/productos',
      { params: { skip: (pagina - 1) * limite, limit: limite, search: busqueda.trim() || undefined } })).data })
  const desactivar = useMutation({
    mutationFn: async (id: number) => axiosInstance.delete(`/productos/${id}`),
    onSuccess: async () => {
      setError('')
      await Promise.all([cliente.invalidateQueries({ queryKey: ['admin', 'productos'] }),
        cliente.invalidateQueries({ queryKey: ['productos'] })])
    },
    onError: (fallo) => setError(handleApiError(fallo)),
  })
  const columnas: ColumnDef<Producto, unknown>[] = [
    { header: 'Producto', accessorKey: 'nombre' },
    { header: 'Categoría', cell: ({ row }) => row.original.categoria.nombre },
    { header: 'Precio', cell: ({ row }) => moneda.format(row.original.precio_base) },
    { header: 'Stock', accessorKey: 'stock' },
    { header: 'Disponibilidad', cell: ({ row }) => row.original.disponible ? 'Disponible' : 'No disponible' },
    { header: 'Acciones', cell: ({ row }) => <div className="flex flex-wrap gap-2">
      <Button variante="secundaria" onClick={() => setEdicion(row.original)}>Editar {row.original.nombre}</Button>
      <Button variante="secundaria" disabled={desactivar.isPending} onClick={() => {
        if (window.confirm(`¿Desactivar el producto ${row.original.nombre}?`)) desactivar.mutate(row.original.id)
      }}>Desactivar {row.original.nombre}</Button>
    </div> },
  ]
  return <AdminPage titulo="Productos">
    <Button onClick={() => setEdicion(null)}>Nuevo producto</Button>
    <div className="max-w-md"><Input id="admin-buscar-producto" etiqueta="Buscar producto" value={busqueda}
      onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1) }} /></div>
    {edicion !== undefined && categorias.data && <ProductoForm key={edicion?.id ?? 'nuevo'}
      producto={edicion} categorias={categorias.data} cerrar={() => setEdicion(undefined)}
      actualizado={async () => {
        await Promise.all([cliente.invalidateQueries({ queryKey: ['admin', 'productos'] }),
          cliente.invalidateQueries({ queryKey: ['productos'] })])
      }} />}
    {error && <EstadoError mensaje={error} />}
    {categorias.isError && <EstadoError mensaje={`Categorías: ${handleApiError(categorias.error)}`} />}
    {productos.isPending && <Cargando mensaje="Cargando productos..." />}
    {productos.isError && <div className="space-y-2"><EstadoError mensaje={handleApiError(productos.error)} />
      <Button onClick={() => void productos.refetch()}>Reintentar</Button></div>}
    {productos.data?.items.length === 0 && <EstadoVacio mensaje="No hay productos activos." />}
    {productos.data && productos.data.items.length > 0 && <TablaAdmin datos={productos.data.items} columnas={columnas} />}
    {productos.data && productos.data.total > limite && <nav aria-label="Paginación de productos" className="flex items-center justify-center gap-3">
      <Button variante="secundaria" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
      <span>Página {pagina}</span>
      <Button variante="secundaria" disabled={pagina * limite >= productos.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
    </nav>}
  </AdminPage>
}
