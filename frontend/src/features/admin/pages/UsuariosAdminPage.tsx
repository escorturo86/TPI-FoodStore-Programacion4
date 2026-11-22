import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { axiosInstance } from '../../../shared/api/axiosInstance'
import { handleApiError } from '../../../shared/api/handleApiError'
import { Cargando } from '../../../shared/components/Cargando'
import { EstadoError } from '../../../shared/components/EstadoError'
import { EstadoVacio } from '../../../shared/components/EstadoVacio'
import { Button } from '../../../shared/ui/Button'
import { useAuthStore } from '../../../store/authStore'
import type { Usuario } from '../../auth/types/Usuario'
import { AdminPage } from '../components/AdminPage'
import { TablaAdmin } from '../components/TablaAdmin'

export function UsuariosAdminPage() {
  const cliente = useQueryClient()
  const actual = useAuthStore((estado) => estado.usuario)
  const [error, setError] = useState('')
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'],
    queryFn: async () => (await axiosInstance.get<Usuario[]>('/admin/usuarios')).data })
  const cambiarEstado = useMutation({
    mutationFn: async ({ id, accion }: { id: number, accion: 'activar' | 'desactivar' }) =>
      axiosInstance.post(`/admin/usuarios/${id}/${accion}`),
    onSuccess: async () => { setError(''); await cliente.invalidateQueries({ queryKey: ['admin', 'usuarios'] }) },
    onError: (fallo) => setError(handleApiError(fallo)),
  })
  const columnas: ColumnDef<Usuario, unknown>[] = [
    { header: 'Usuario', accessorKey: 'username' },
    { header: 'Nombre', accessorKey: 'full_name' },
    { header: 'Correo', accessorKey: 'email' },
    { header: 'Rol', accessorKey: 'role' },
    { header: 'Estado', cell: ({ row }) => row.original.disabled ? 'Inactivo' : 'Activo' },
    { header: 'Acciones', cell: ({ row }) => row.original.disabled
      ? <Button variante="secundaria" disabled={cambiarEstado.isPending}
        onClick={() => cambiarEstado.mutate({ id: row.original.id, accion: 'activar' })}>
        Activar {row.original.username}</Button>
      : <Button variante="secundaria" disabled={cambiarEstado.isPending || row.original.id === actual?.id}
        title={row.original.id === actual?.id ? 'No podés desactivar tu propia cuenta' : undefined}
        onClick={() => {
          if (window.confirm(`¿Desactivar al usuario ${row.original.username}?`))
            cambiarEstado.mutate({ id: row.original.id, accion: 'desactivar' })
        }}>Desactivar {row.original.username}</Button> },
  ]
  return <AdminPage titulo="Usuarios">
    {error && <EstadoError mensaje={error} />}
    {usuarios.isPending && <Cargando mensaje="Cargando usuarios..." />}
    {usuarios.isError && <div className="space-y-2"><EstadoError mensaje={handleApiError(usuarios.error)} />
      <Button onClick={() => void usuarios.refetch()}>Reintentar</Button></div>}
    {usuarios.data?.length === 0 && <EstadoVacio mensaje="No hay usuarios." />}
    {usuarios.data && usuarios.data.length > 0 && <TablaAdmin datos={usuarios.data} columnas={columnas} />}
  </AdminPage>
}
