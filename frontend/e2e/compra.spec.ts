import { expect, request, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://localhost:8002/api/v1'

async function crearCliente(page: import('@playwright/test').Page) {
  const usuario = `e2e_${randomUUID().slice(0, 12)}`
  await page.goto('/register')
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Nombre completo').fill('Comprador E2E')
  await page.getByLabel('Correo electrónico').fill(`${usuario}@example.test`)
  await page.getByLabel('Contraseña').fill('Cliente123!')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Contraseña').fill('Cliente123!')
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByText('Comprador E2E (user)')).toBeVisible()
  return usuario
}

async function prepararProducto() {
  const admin = await request.newContext({ baseURL: `${api}/` })
  const login = await admin.post('auth/token', { form: { username: 'admin', password: 'Admin1234!' } })
  expect(login.status()).toBe(200)
  const categorias = await admin.get('categorias')
  expect(categorias.status()).toBe(200)
  const categoriaId = (await categorias.json())[0].id as number
  const nombre = `E2E Compra ${randomUUID().slice(0, 8)}`
  const respuesta = await admin.post('productos', { data: {
    categoria_id: categoriaId, nombre, descripcion: 'Producto para prueba E2E', precio_base: 120,
    stock: 5, disponible: true,
  } })
  expect(respuesta.status()).toBe(201)
  const id = (await respuesta.json()).id as number
  return { admin, nombre, id }
}

test('catálogo: búsqueda, categoría, paginación, vacío y error', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hamburguesa clásica' })).toBeVisible()
  await expect(page.getByText(/productos encontrados/)).toBeVisible()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByText(/Página 2 de/)).toBeVisible()

  await page.getByLabel('Buscar por nombre').fill('Pizza napolitana')
  await expect(page.getByRole('heading', { name: 'Pizza napolitana' })).toBeVisible()
  await expect(page.getByText('1 productos encontrados')).toBeVisible()
  await page.getByLabel('Buscar por nombre').fill('NoExisteEnFoodStore123')
  await expect(page.getByText('No se encontraron productos.')).toBeVisible()

  await page.getByLabel('Buscar por nombre').fill('')
  await page.getByLabel('Categoría').selectOption({ label: 'Bebidas' })
  await expect(page.getByRole('heading', { name: 'Gaseosa' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Agua mineral' })).toBeVisible()

  await page.route('**/api/v1/productos?**', (ruta) => ruta.abort())
  await page.getByLabel('Buscar por nombre').fill('fallo-red')
  await expect(page.getByText('No se pudo conectar con el servidor.')).toBeVisible()
  await page.unrouteAll()
})

test('catálogo muestra carga mientras espera productos', async ({ page }) => {
  let continuar: (() => void) | undefined
  await page.route('**/api/v1/productos?**', async (ruta) => {
    await new Promise<void>((resolver) => { continuar = resolver })
    await ruta.continue()
  })
  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Cargando productos' })).toBeVisible()
  continuar?.()
  await expect(page.getByRole('heading', { name: 'Hamburguesa clásica' })).toBeVisible()
})

test('carrito público: dos productos, cantidades y recarga', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Agregar Hamburguesa clásica' }).click()
  await page.getByRole('button', { name: 'Agregar Hamburguesa doble' }).click()
  await page.getByRole('link', { name: /Carrito \(2\)/ }).click()
  await expect(page.getByRole('heading', { name: 'Carrito' })).toBeVisible()
  await expect(page.getByText('Total: $ 17.000', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Total: $ 17.000', { exact: true })).toBeVisible()
  await page.getByLabel('Cantidad de Hamburguesa clásica').fill('2')
  await expect(page.getByText('Total: $ 24.500', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Quitar Hamburguesa doble' }).click()
  await expect(page.getByText('Total: $ 15.000', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Confirmar pedido' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('compra, stock, pedido propio y cancelación', async ({ page }) => {
  const producto = await prepararProducto()
  try {
    await crearCliente(page)
    await page.getByLabel('Buscar por nombre').fill(producto.nombre)
    const agregar = page.getByRole('button', { name: `Agregar ${producto.nombre}` })
    await expect(agregar).toBeVisible()
    await agregar.click()
    await agregar.click()
    await page.getByRole('link', { name: /Carrito \(2\)/ }).click()
    await expect(page.getByText('Total: $ 240', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Confirmar pedido' }).click()
    await page.getByLabel('Dirección de entrega').fill('123')
    await expect(page.getByRole('button', { name: 'Comprar' })).toBeDisabled()
    await expect(page).toHaveURL(/\/checkout$/)
    await page.getByLabel('Dirección de entrega').fill('Calle de prueba 123')
    await page.getByLabel('Forma de pago').selectOption('TRANSFERENCIA')
    await page.getByLabel('Notas (opcional)').fill('Sin sal')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(page).toHaveURL(/\/mis-pedidos$/)
    await expect(page.getByText('Total: $ 240', { exact: true })).toBeVisible()
    await expect(page.getByText(`${producto.nombre} × 2`)).toBeVisible()
    await expect(page.getByText('Notas: Sin sal')).toBeVisible()
    const productoComprado = await producto.admin.get(`productos/${producto.id}`)
    expect((await productoComprado.json()).stock).toBe(3)
    const pedido = await page.evaluate(async (url) => {
      const respuesta = await fetch(url, { credentials: 'include' })
      return (await respuesta.json()).items[0] as { id: number }
    }, `${api}/pedidos`)
    const otro = await request.newContext({ baseURL: `${api}/` })
    try {
      const usuarioOtro = `e2e_${randomUUID().slice(0, 12)}`
      expect((await otro.post('auth/register', { data: {
        username: usuarioOtro, full_name: 'Otro cliente', email: `${usuarioOtro}@example.test`, password: 'Cliente123!',
      } })).status()).toBe(201)
      expect((await otro.post('auth/token', { form: { username: usuarioOtro, password: 'Cliente123!' } })).status()).toBe(200)
      expect((await otro.get(`pedidos/${pedido.id}`)).status()).toBe(403)
      expect((await otro.get('pedidos')).status()).toBe(200)
      expect((await (await otro.get('pedidos')).json()).items).toHaveLength(0)
    } finally {
      await otro.dispose()
    }
    await page.getByRole('button', { name: /Cancelar pedido #/ }).click()
    await expect(page.getByText('CANCELADO')).toBeVisible()
    await expect(page.getByRole('button', { name: /Cancelar pedido #/ })).toHaveCount(0)
    const productoCancelado = await producto.admin.get(`productos/${producto.id}`)
    expect((await productoCancelado.json()).stock).toBe(5)
    const segundaCancelacion = await page.evaluate(async (url) => {
      const respuesta = await fetch(url, { method: 'PATCH', credentials: 'include' })
      return respuesta.status
    }, `${api}/pedidos/${pedido.id}/cancelar`)
    expect(segundaCancelacion).toBe(400)
    expect((await (await producto.admin.get(`productos/${producto.id}`)).json()).stock).toBe(5)
  } finally {
    await producto.admin.dispose()
  }
})

test('compra rechazada conserva el carrito y muestra error', async ({ page }) => {
  const producto = await prepararProducto()
  try {
    await crearCliente(page)
    const invalida = await page.evaluate(async (url) => {
      const respuesta = await fetch(url, { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ producto_id: 99999999, cantidad: 0 }],
          forma_pago: 'EFECTIVO', direccion_entrega: 'Calle de prueba 123' }) })
      return respuesta.status
    }, `${api}/pedidos`)
    expect(invalida).toBe(422)
    const inexistente = await page.evaluate(async (url) => {
      const respuesta = await fetch(url, { method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ producto_id: 99999999, cantidad: 1 }],
          forma_pago: 'EFECTIVO', direccion_entrega: 'Calle de prueba 123' }) })
      return respuesta.status
    }, `${api}/pedidos`)
    expect(inexistente).toBe(404)
    await page.getByLabel('Buscar por nombre').fill(producto.nombre)
    await page.getByRole('button', { name: `Agregar ${producto.nombre}` }).click()
    await page.getByRole('link', { name: /Carrito \(1\)/ }).click()
    await page.getByRole('link', { name: 'Confirmar pedido' }).click()
    await page.getByLabel('Dirección de entrega').fill('Calle de prueba 123')
    expect((await producto.admin.patch(`productos/${producto.id}/stock`, { data: { stock: 0, disponible: true } })).status()).toBe(200)
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(page.getByText(/stock insuficiente/i)).toBeVisible()
    await page.getByRole('link', { name: /Carrito \(1\)/ }).click()
    await expect(page.getByText('Total: $ 120', { exact: true })).toBeVisible()
  } finally {
    await producto.admin.dispose()
  }
})

test('error de comunicación al comprar conserva el carrito', async ({ page }) => {
  const producto = await prepararProducto()
  try {
    await crearCliente(page)
    await page.getByLabel('Buscar por nombre').fill(producto.nombre)
    await page.getByRole('button', { name: `Agregar ${producto.nombre}` }).click()
    await page.getByRole('link', { name: /Carrito \(1\)/ }).click()
    await page.getByRole('link', { name: 'Confirmar pedido' }).click()
    await page.getByLabel('Dirección de entrega').fill('Calle de prueba 123')
    await page.route('**/api/v1/pedidos', (ruta) => ruta.abort())
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(page.getByText('No se pudo conectar con el servidor.')).toBeVisible()
    await page.getByRole('link', { name: /Carrito \(1\)/ }).click()
    await expect(page.getByText('Total: $ 120', { exact: true })).toBeVisible()
    expect((await (await producto.admin.get(`productos/${producto.id}`)).json()).stock).toBe(5)
  } finally {
    await producto.admin.dispose()
  }
})

test('catálogo y navegación en tamaño celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Carrito/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Agregar Hamburguesa clásica' })).toBeVisible()
})
