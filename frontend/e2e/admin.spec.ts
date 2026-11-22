import { expect, request, test, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://localhost:8002/api/v1'
const sufijo = () => randomUUID().slice(0, 8)

async function ingresarAdmin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill('admin')
  await page.getByLabel('Contraseña').fill('Admin1234!')
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/resumen$/)
}

test('admin crea, edita y desactiva categoría y producto', async ({ page }) => {
  const categoria = `E2E Categoria ${sufijo()}`
  const categoriaEditada = `E2E Categoria Editada ${sufijo()}`
  const producto = `E2E Producto ${sufijo()}`
  const productoEditado = `E2E Producto Editado ${sufijo()}`
  page.on('dialog', (dialogo) => void dialogo.accept())
  await ingresarAdmin(page)
  await page.getByRole('link', { name: 'Categorías' }).click()
  await page.getByRole('button', { name: 'Nueva categoría' }).click()
  await page.getByLabel('Nombre').fill(categoria)
  await page.getByLabel('Descripción').fill('Categoría de prueba')
  await page.getByRole('button', { name: 'Guardar categoría' }).click()
  await expect(page.getByRole('row').filter({ hasText: categoria })).toBeVisible()
  await page.getByRole('button', { name: `Editar ${categoria}` }).click()
  await page.getByLabel('Nombre').fill(categoriaEditada)
  await page.getByRole('button', { name: 'Guardar categoría' }).click()
  await expect(page.getByRole('row').filter({ hasText: categoriaEditada })).toBeVisible()

  await page.getByRole('link', { name: 'Productos' }).click()
  await page.getByRole('button', { name: 'Nuevo producto' }).click()
  await page.getByLabel('Nombre').fill(producto)
  await page.getByLabel('Categoría del producto').selectOption({ label: categoriaEditada })
  await page.getByLabel('Descripción').fill('Producto de prueba')
  await page.getByLabel('Precio').fill('1250')
  await page.getByLabel('Stock').fill('5')
  await page.getByRole('button', { name: 'Guardar producto' }).click()
  await page.getByLabel('Buscar producto').fill(producto)
  await expect(page.getByRole('row').filter({ hasText: producto })).toBeVisible()
  await page.getByRole('button', { name: `Editar ${producto}` }).click()
  await page.getByLabel('Nombre').fill(productoEditado)
  await page.getByLabel('Stock').fill('7')
  await page.getByLabel('Disponible para comprar').uncheck()
  await page.getByRole('button', { name: 'Guardar producto' }).click()
  await page.getByLabel('Buscar producto').fill(productoEditado)
  const fila = page.getByRole('row').filter({ hasText: productoEditado })
  await expect(fila).toContainText('7')
  await expect(fila).toContainText('No disponible')
  await page.getByRole('button', { name: `Desactivar ${productoEditado}` }).click()
  await expect(fila).toHaveCount(0)
  await page.getByRole('link', { name: 'Categorías' }).click()
  await page.getByRole('button', { name: `Desactivar ${categoriaEditada}` }).click()
  await expect(page.getByRole('row').filter({ hasText: categoriaEditada })).toHaveCount(0)
})

test('admin gestiona pedidos, cancelación, stock e indicadores', async ({ page }) => {
  const admin = await request.newContext({ baseURL: `${api}/` })
  const cliente = await request.newContext({ baseURL: `${api}/` })
  let productoId: number | undefined
  try {
    expect((await admin.post('auth/token', { form: { username: 'admin', password: 'Admin1234!' } })).status()).toBe(200)
    const previo = await (await admin.get('pedidos/resumen')).json()
    const categorias = await (await admin.get('categorias')).json()
    const nuevo = await admin.post('productos', { data: {
      categoria_id: categorias.find((item: { nombre: string }) => item.nombre === 'Hamburguesas').id,
      nombre: `E2E Pedido Producto ${sufijo()}`, precio_base: 500, stock: 6, disponible: true,
    } })
    expect(nuevo.status()).toBe(201)
    productoId = (await nuevo.json()).id as number
    const username = `e2e_${sufijo()}`
    expect((await cliente.post('auth/register', { data: {
      username, full_name: 'Cliente Admin E2E', email: `${username}@example.test`, password: 'Cliente123!',
    } })).status()).toBe(201)
    expect((await cliente.post('auth/token', { form: { username, password: 'Cliente123!' } })).status()).toBe(200)
    const compra = { items: [{ producto_id: productoId, cantidad: 1 }],
      forma_pago: 'EFECTIVO', direccion_entrega: 'Calle de prueba 123' }
    const primero = await cliente.post('pedidos', { data: compra })
    const segundo = await cliente.post('pedidos', { data: compra })
    expect(primero.status()).toBe(201)
    expect(segundo.status()).toBe(201)
    const primeroId = (await primero.json()).id as number
    const segundoId = (await segundo.json()).id as number

    page.on('dialog', (dialogo) => void dialogo.accept())
    await ingresarAdmin(page)
    await expect(page.getByText('Pendientes').locator('..').locator('p')).toHaveText(String(previo.pendientes + 2))
    await page.getByRole('navigation', { name: 'Administración' }).getByRole('link', { name: 'Pedidos' }).click()
    await page.getByRole('button', { name: `Preparar pedido #${primeroId}` }).click()
    await expect(page.getByRole('button', { name: `Entregar pedido #${primeroId}` })).toBeVisible()
    await page.getByRole('button', { name: `Entregar pedido #${primeroId}` }).click()
    await expect(page.getByRole('button', { name: `Entregar pedido #${primeroId}` })).toHaveCount(0)
    await page.getByRole('button', { name: `Cancelar pedido #${segundoId}` }).click()
    await expect(page.getByRole('button', { name: `Cancelar pedido #${segundoId}` })).toHaveCount(0)
    await expect.poll(async () => (await (await admin.get(`productos/${productoId}`)).json()).stock).toBe(5)
    await page.getByRole('link', { name: 'Resumen' }).click()
    await expect(page.getByText('Entregados', { exact: true }).locator('..').locator('p')).toHaveText(String(previo.entregados + 1))
    await expect(page.getByText('Cancelados', { exact: true }).locator('..').locator('p')).toHaveText(String(previo.cancelados + 1))
    await expect(page.getByText('Ingresos entregados', { exact: true }).locator('..').locator('p'))
      .toContainText(new Intl.NumberFormat('es-AR').format(previo.ingresos_entregados + 500))
  } finally {
    if (productoId) await admin.delete(`productos/${productoId}`)
    await admin.dispose()
    await cliente.dispose()
  }
})

test('admin gestiona usuarios y cliente no accede al panel ni a la API', async ({ page }) => {
  const admin = await request.newContext({ baseURL: `${api}/` })
  const cliente = await request.newContext({ baseURL: `${api}/` })
  try {
    const username = `e2e_${sufijo()}`
    const registro = await cliente.post('auth/register', { data: {
      username, full_name: 'Usuario Admin E2E', email: `${username}@example.test`, password: 'Cliente123!',
    } })
    expect(registro.status()).toBe(201)
    const id = (await registro.json()).id as number
    expect((await cliente.post('auth/token', { form: { username, password: 'Cliente123!' } })).status()).toBe(200)
    expect((await admin.post('auth/token', { form: { username: 'admin', password: 'Admin1234!' } })).status()).toBe(200)
    const yo = await (await admin.get('auth/me')).json()
    expect((await cliente.get('admin/usuarios')).status()).toBe(403)
    expect((await cliente.get('pedidos/resumen')).status()).toBe(403)
    expect((await cliente.post('categorias', { data: { nombre: `E2E Bloqueada ${sufijo()}` } })).status()).toBe(403)
    expect((await cliente.post('productos', { data: { categoria_id: 1, nombre: 'E2E Bloqueado', precio_base: 1 } })).status()).toBe(403)
    expect((await cliente.patch('pedidos/1/estado', { data: { estado: 'ENTREGADO' } })).status()).toBe(403)
    expect((await cliente.post(`admin/usuarios/${id}/desactivar`)).status()).toBe(403)
    expect((await admin.post(`admin/usuarios/${yo.id}/desactivar`)).status()).toBe(400)

    await page.goto('/login')
    await page.getByLabel('Usuario').fill(username)
    await page.getByLabel('Contraseña').fill('Cliente123!')
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
    await expect(page.getByText('Usuario Admin E2E (user)')).toBeVisible()
    for (const ruta of ['resumen', 'categorias', 'productos', 'pedidos', 'usuarios']) {
      await page.goto(`/admin/${ruta}`)
      await expect(page).toHaveURL(/\/unauthorized$/)
    }
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
    await ingresarAdmin(page)
    await page.getByRole('link', { name: 'Usuarios' }).click()
    await expect(page.getByRole('button', { name: `Desactivar ${yo.username}` })).toBeDisabled()
    page.on('dialog', (dialogo) => void dialogo.accept())
    await page.getByRole('button', { name: `Desactivar ${username}` }).click()
    await expect(page.getByRole('button', { name: `Activar ${username}` })).toBeVisible()
    await page.getByRole('button', { name: `Activar ${username}` }).click()
    await expect(page.getByRole('button', { name: `Desactivar ${username}` })).toBeVisible()
  } finally { await admin.dispose(); await cliente.dispose() }
})

test('panel administrativo en escritorio y celular', async ({ page }) => {
  await ingresarAdmin(page)
  for (const vista of [{ nombre: 'escritorio', ancho: 1440, alto: 900 },
    { nombre: 'celular', ancho: 390, alto: 844 }]) {
    await page.setViewportSize({ width: vista.ancho, height: vista.alto })
    for (const seccion of ['resumen', 'categorias', 'productos', 'pedidos', 'usuarios']) {
      await page.goto(`/admin/${seccion}`)
      await expect(page.getByRole('navigation', { name: 'Administración' })).toBeVisible()
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.getByRole('status')).toHaveCount(0)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `test-results/admin-${vista.nombre}-${seccion}.png` })
    }
  }
})
