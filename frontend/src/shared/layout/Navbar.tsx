import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { useCartStore } from '../../store/cartStore'

export function Navbar() {
  const usuario = useAuthStore((state) => state.usuario)
  const cantidadCarrito = useCartStore((state) => state.items.reduce((suma, item) => suma + item.cantidad, 0))
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [error, setError] = useState('')

  async function cerrarSesion() {
    setError('')
    try {
      await logout()
      navigate('/login')
    } catch {
      setError('No se pudo avisar al servidor. Tu sesión local fue cerrada.')
      navigate('/login')
    }
  }

  const enlace = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-2 py-1 hover:bg-emerald-50 ${isActive ? 'font-semibold text-emerald-800' : 'text-slate-700'}`

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="text-xl font-bold text-emerald-800">Food Store</Link>
          <NavLink to="/" end className={enlace}>Catálogo</NavLink>
          <NavLink to="/carrito" className={enlace}>Carrito ({cantidadCarrito})</NavLink>
          {usuario && <NavLink to="/mi-cuenta" className={enlace}>Mi cuenta</NavLink>}
          {usuario && <NavLink to="/mis-pedidos" className={enlace}>Mis pedidos</NavLink>}
          {usuario?.role === 'admin' && <NavLink to="/admin/resumen" className={enlace}>Administración</NavLink>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {usuario ? (
            <>
              <span className="text-sm text-slate-600">{usuario.full_name} ({usuario.role})</span>
              <Button variante="secundaria" onClick={() => void cerrarSesion()}>Cerrar sesión</Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={enlace}>Ingresar</NavLink>
              <NavLink to="/register" className={enlace}>Registrarse</NavLink>
            </>
          )}
        </div>
      </nav>
      {error && <p className="mx-auto max-w-6xl px-4 pb-2 text-sm text-red-700">{error}</p>}
    </header>
  )
}
