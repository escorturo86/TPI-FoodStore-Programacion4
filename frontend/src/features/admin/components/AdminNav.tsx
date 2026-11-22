import { NavLink } from 'react-router-dom'

const enlaces = [
  ['/admin/resumen', 'Resumen'],
  ['/admin/categorias', 'Categorías'],
  ['/admin/productos', 'Productos'],
  ['/admin/pedidos', 'Pedidos'],
  ['/admin/usuarios', 'Usuarios'],
]

export function AdminNav() {
  return <nav aria-label="Administración" className="flex flex-wrap gap-2">
    {enlaces.map(([ruta, texto]) => <NavLink key={ruta} to={ruta}
      className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive
        ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-800 hover:bg-emerald-50'}`}>
      {texto}
    </NavLink>)}
  </nav>
}
