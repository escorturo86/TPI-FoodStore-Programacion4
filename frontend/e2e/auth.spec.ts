import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const api = 'http://localhost:8002/api/v1'

async function registrar(page: import('@playwright/test').Page) {
  const usuario = `e2e_${randomUUID().slice(0, 12)}`
  await page.goto('/register')
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Nombre completo').fill('Cliente E2E')
  await page.getByLabel('Correo electrónico').fill(`${usuario}@example.test`)
  await page.getByLabel('Contraseña').fill('Cliente123!')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page).toHaveURL(/\/login$/)
  return usuario
}

async function ingresar(page: import('@playwright/test').Page, usuario: string, clave: string) {
  await page.goto('/login')
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Contraseña').fill(clave)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

test('registro, validación y usuario duplicado', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Usuario').fill('ab')
  await page.getByLabel('Nombre completo').fill('Cliente E2E')
  await page.getByLabel('Correo electrónico').fill('correo-invalido')
  await page.getByLabel('Contraseña').fill('123')
  await expect(page.getByRole('button', { name: 'Registrarme' })).toBeDisabled()

  const usuario = await registrar(page)
  await page.goto('/register')
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Nombre completo').fill('Cliente E2E')
  await page.getByLabel('Correo electrónico').fill(`${usuario}@example.test`)
  await page.getByLabel('Contraseña').fill('Cliente123!')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByText(/ya existe|registrado|duplicado/i)).toBeVisible()
})

test('cliente, cookie HttpOnly, CORS, recarga y logout', async ({ page, context }) => {
  const usuario = await registrar(page)
  await ingresar(page, usuario, 'incorrecta')
  await expect(page.getByText(/credenciales|incorrect/i)).toBeVisible()
  await ingresar(page, usuario, 'Cliente123!')
  await expect(page.getByText('Cliente E2E (user)')).toBeVisible()

  const cookie = (await context.cookies()).find((valor) => valor.name === 'access_token')
  expect(cookie).toBeDefined()
  expect(cookie?.httpOnly).toBe(true)
  expect(cookie?.sameSite).toBe('Lax')
  expect(cookie?.secure).toBe(false)
  expect(await page.evaluate(() => document.cookie.includes('access_token'))).toBe(false)
  expect(await page.evaluate(() => localStorage.getItem('foodstore-auth'))).not.toContain('access_token')

  const conexion = await page.evaluate(async (url) => {
    const respuesta = await fetch(url, { credentials: 'include' })
    return { estado: respuesta.status, origen: respuesta.headers.get('access-control-allow-origin') }
  }, `${api}/auth/me`)
  expect(conexion.estado).toBe(200)
  expect(conexion.origen).toBeNull() // El navegador no expone este encabezado de respuesta.

  await page.reload()
  await expect(page.getByText('Cliente E2E (user)')).toBeVisible()
  await page.getByRole('link', { name: 'Mi cuenta' }).click()
  await expect(page.getByRole('heading', { name: 'Mi cuenta' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect((await context.cookies()).some((valor) => valor.name === 'access_token')).toBe(false)
  await page.goto('/mi-cuenta')
  await expect(page).toHaveURL(/\/login$/)
})

test('rutas por rol y permisos de la API', async ({ page }) => {
  await page.goto('/admin/resumen')
  await expect(page).toHaveURL(/\/login$/)
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)

  const usuario = await registrar(page)
  await ingresar(page, usuario, 'Cliente123!')
  await expect(page.getByText('Cliente E2E (user)')).toBeVisible()
  const sinPermiso = await page.evaluate(async (url) => {
    const respuesta = await fetch(url, { credentials: 'include' })
    return respuesta.status
  }, `${api}/pedidos/resumen`)
  expect(sinPermiso).toBe(403)
  await page.goto('/admin/resumen')
  await expect(page).toHaveURL(/\/unauthorized$/)
  await expect(page.getByRole('heading', { name: /acceso denegado/i })).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await ingresar(page, 'admin', 'Admin1234!')
  await expect(page).toHaveURL(/\/admin\/resumen$/)
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Administración' })).toBeVisible()
  const permitido = await page.evaluate(async (url) => {
    const respuesta = await fetch(url, { credentials: 'include' })
    return respuesta.status
  }, `${api}/pedidos/resumen`)
  expect(permitido).toBe(200)
})

test('sesión invalidada en el navegador', async ({ page, context }) => {
  const usuario = await registrar(page)
  await ingresar(page, usuario, 'Cliente123!')
  await expect(page.getByText('Cliente E2E (user)')).toBeVisible()
  await context.clearCookies()
  const estado = await page.evaluate(async (url) => {
    const respuesta = await fetch(url, { credentials: 'include' })
    return respuesta.status
  }, `${api}/auth/me`)
  expect(estado).toBe(401)
  await page.goto('/mi-cuenta')
  await page.reload()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('link', { name: 'Mi cuenta' })).toHaveCount(0)
})
