import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Cargando } from '../shared/components/Cargando'
import { useAuthStore } from '../store/authStore'

interface Props {
  rol?: 'user' | 'admin'
}

export function ProtectedRoute({ rol }: Props) {
  const usuario = useAuthStore((state) => state.usuario)
  const comprobando = useAuthStore((state) => state.comprobando)
  const location = useLocation()

  if (comprobando) return <Cargando mensaje="Comprobando sesión..." />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (rol && usuario.role !== rol) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
