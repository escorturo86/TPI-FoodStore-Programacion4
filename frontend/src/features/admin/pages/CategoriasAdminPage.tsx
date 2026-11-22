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
import type { Categoria } from '../../productos/types/Producto'
import { AdminPage } from '../components/AdminPage'
import { TablaAdmin } from '../components/TablaAdmin'

function CategoriaForm({ categoria, cerrar, actualizado }: {
  categoria: Categoria | null, cerrar: () => void, actualizado: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      setError('')
      try {
        const datos = { nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }
        if (categoria) await axiosInstance.put(`/categorias/${categoria.id}`, datos)
        else await axiosInstance.post('/categorias', datos)
        await actualizado()
        cerrar()
      } catch (fallo) { setError(handleApiError(fallo)) }
    },
  })
  return <Card className="max-w-2xl">
    <h2 className="text-xl font-semibold">{categoria ? 'Editar categoría' : 'Nueva categoría'}</h2>
    <form className="mt-4 space-y-3" onSubmit={(evento) => { evento.preventDefault(); void form.handleSubmit() }}>
      <form.Field name="nombre" validators={{ onChange: ({ value }) => value.trim().length >= 2 && value.trim().length <= 100
        ? undefined : 'El nombre debe tener entre 2 y 100 caracteres' }}>
        {(campo) => <Input id="categoria-nombre" etiqueta="Nombre" required minLength={2} maxLength={100}
          value={campo.state.value} onBlur={campo.handleBlur} onChange={(evento) => campo.handleChange(evento.target.value)}
          error={campo.state.meta.isTouched ? campo.state.meta.errors.map(String).join(', ') : ''} />}
      </form.Field>
      <form.Field name="descripcion">{(campo) => <Input id="categoria-descripcion" etiqueta="Descripción"
        value={campo.state.value} onChange={(evento) => campo.handleChange(evento.target.value)} />}</form.Field>
      {error && <EstadoError mensaje={error} />}
      <div className="flex gap-2"><form.Subscribe selector={(estado) => [estado.canSubmit, estado.isSubmitting] as const}>
        {([puede, guardando]) => <Button type="submit" disabled={!puede || guardando}>Guardar categoría</Button>}
      </form.Subscribe><Button type="button" variante="secundaria" onClick={cerrar}>Cerrar</Button></div>
    </form>
  </Card>
}

export function CategoriasAdminPage() {
  const cliente = useQueryClient()
  const [edicion, setEdicion] = useState<Categoria | null | undefined>(undefined)
  const [error, setError] = useState('')
  const categorias = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => (await axiosInstance.get<Categoria[]>('/categorias')).data,
  })
  const desactivar = useMutation({
    mutationFn: async (id: number) => axiosInstance.delete(`/categorias/${id}`),
    onSuccess: async () => { setError(''); await cliente.invalidateQueries({ queryKey: ['categorias'] }) },
    onError: (fallo) => setError(handleApiError(fallo)),
  })
  const columnas: ColumnDef<Categoria, unknown>[] = [
    { header: 'Nombre', accessorKey: 'nombre' },
    { header: 'Descripción', accessorKey: 'descripcion', cell: ({ row }) => row.original.descripcion || '—' },
    { header: 'Acciones', cell: ({ row }) => <div className="flex flex-wrap gap-2">
      <Button variante="secundaria" onClick={() => setEdicion(row.original)}>Editar {row.original.nombre}</Button>
      <Button variante="secundaria" disabled={desactivar.isPending} onClick={() => {
        if (window.confirm(`¿Desactivar la categoría ${row.original.nombre}?`)) desactivar.mutate(row.original.id)
      }}>Desactivar {row.original.nombre}</Button>
    </div> },
  ]
  return <AdminPage titulo="Categorías">
    <Button onClick={() => setEdicion(null)}>Nueva categoría</Button>
    {edicion !== undefined && <CategoriaForm key={edicion?.id ?? 'nueva'} categoria={edicion}
      cerrar={() => setEdicion(undefined)} actualizado={async () => {
        await cliente.invalidateQueries({ queryKey: ['categorias'] })
      }} />}
    {error && <EstadoError mensaje={error} />}
    {categorias.isPending && <Cargando mensaje="Cargando categorías..." />}
    {categorias.isError && <div className="space-y-2"><EstadoError mensaje={handleApiError(categorias.error)} />
      <Button onClick={() => void categorias.refetch()}>Reintentar</Button></div>}
    {categorias.data?.length === 0 && <EstadoVacio mensaje="No hay categorías activas." />}
    {categorias.data && categorias.data.length > 0 && <TablaAdmin datos={categorias.data} columnas={columnas} />}
  </AdminPage>
}
