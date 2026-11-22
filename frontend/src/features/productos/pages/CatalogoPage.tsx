import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Skeleton } from '../../../shared/components/Skeleton'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { useCartStore } from '../../../store/cartStore'
import type { Categoria, ProductosPaginados } from '../types/Producto'

const limite = 6
const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const imagenRespaldo = '/images/productos/sin-imagen.svg'

export function CatalogoPage() {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [pagina, setPagina] = useState(1)
  const agregar = useCartStore((state) => state.agregar)

  const categorias = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await axiosInstance.get<Categoria[]>('/categorias')).data,
  })
  const productos = useQuery({
    queryKey: ['productos', busqueda, categoriaId, pagina],
    queryFn: async () => (await axiosInstance.get<ProductosPaginados>('/productos', {
      params: { skip: (pagina - 1) * limite, limit: limite, search: busqueda.trim() || undefined,
        categoria_id: categoriaId || undefined },
    })).data,
  })
  const paginas = Math.ceil((productos.data?.total ?? 0) / limite)

  return <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold">Catálogo</h1>
      <p className="mt-1 text-slate-600">Elegí productos y agregalos al carrito.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">Buscar por nombre
        <input aria-label="Buscar por nombre" className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={busqueda}
          onChange={(event) => { setBusqueda(event.target.value); setPagina(1) }} />
      </label>
      <label className="block text-sm font-medium">Categoría
        <select aria-label="Categoría" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"
          value={categoriaId} onChange={(event) => { setCategoriaId(event.target.value); setPagina(1) }}>
          <option value="">Todas</option>
          {categorias.data?.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
        </select>
      </label>
    </div>
    {categorias.isError && <EstadoError mensaje={`No se cargaron las categorías: ${handleApiError(categorias.error)}`} />}
    {productos.isPending && <Skeleton />}
    {productos.isError && <div className="space-y-3"><EstadoError mensaje={handleApiError(productos.error)} />
      <Button onClick={() => void productos.refetch()}>Reintentar</Button></div>}
    {productos.data?.items.length === 0 && <EstadoVacio mensaje="No se encontraron productos." />}
    {productos.data && productos.data.items.length > 0 && <>
      <p className="text-sm text-slate-600">{productos.data.total} productos encontrados</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {productos.data.items.map((producto) => <Card key={producto.id} className="flex flex-col">
          <img src={producto.imagen_url || imagenRespaldo} alt={producto.nombre}
            className="h-40 w-full rounded-md object-cover" loading="lazy"
            style={producto.categoria.nombre === 'Bebidas' ? { objectPosition: 'center 75%' } : undefined}
            onError={(event) => {
              if (!event.currentTarget.src.endsWith(imagenRespaldo)) event.currentTarget.src = imagenRespaldo
            }} />
          <h2 className="mt-3 text-lg font-semibold">{producto.nombre}</h2>
          <p className="text-sm text-slate-500">{producto.categoria.nombre}</p>
          {producto.descripcion && <p className="mt-1 text-sm text-slate-600">{producto.descripcion}</p>}
          <p className="mt-3 font-semibold">{moneda.format(producto.precio_base)}</p>
          <p className="mb-3 text-sm">{producto.disponible && producto.stock > 0
            ? `Disponible: ${producto.stock}` : 'No disponible'}</p>
          <Button className="mt-auto" disabled={!producto.disponible || producto.stock < 1}
            onClick={() => agregar(producto)}>Agregar {producto.nombre}</Button>
        </Card>)}
      </div>
      {paginas > 1 && <nav aria-label="Paginación" className="flex items-center justify-center gap-4">
        <Button variante="secundaria" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
        <span>Página {pagina} de {paginas}</span>
        <Button variante="secundaria" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
      </nav>}
    </>}
    <Link to="/carrito" className="inline-block text-emerald-700 underline">Ver carrito</Link>
  </div>
}
