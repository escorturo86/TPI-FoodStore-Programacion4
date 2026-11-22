import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ResumenAdminPage } from '../features/admin/pages/ResumenAdminPage'
import { CategoriasAdminPage } from '../features/admin/pages/CategoriasAdminPage'
import { ProductosAdminPage } from '../features/admin/pages/ProductosAdminPage'
import { PedidosAdminPage } from '../features/admin/pages/PedidosAdminPage'
import { UsuariosAdminPage } from '../features/admin/pages/UsuariosAdminPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { MiCuentaPage } from '../features/auth/pages/MiCuentaPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage'
import { CatalogoPage } from '../features/productos/pages/CatalogoPage'
import { CarritoPage } from '../features/pedidos/pages/CarritoPage'
import { CheckoutPage } from '../features/pedidos/pages/CheckoutPage'
import { MisPedidosPage } from '../features/pedidos/pages/MisPedidosPage'
import { MainLayout } from '../shared/layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/mi-cuenta" element={<MiCuentaPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>
          <Route element={<ProtectedRoute rol="admin" />}>
            <Route path="/admin/resumen" element={<ResumenAdminPage />} />
            <Route path="/admin/categorias" element={<CategoriasAdminPage />} />
            <Route path="/admin/productos" element={<ProductosAdminPage />} />
            <Route path="/admin/pedidos" element={<PedidosAdminPage />} />
            <Route path="/admin/usuarios" element={<UsuariosAdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
