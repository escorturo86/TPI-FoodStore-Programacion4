import { expect, test, type Page } from '@playwright/test'

const nombres = [
  'Hamburguesa clásica', 'Hamburguesa doble', 'Hamburguesa vegetariana',
  'Pizza muzzarella', 'Pizza napolitana', 'Pizza fugazzeta',
  'Gaseosa', 'Agua mineral',
]
const categorias = [
  { nombre: 'Hamburguesas', productos: nombres.slice(0, 3) },
  { nombre: 'Pizzas', productos: nombres.slice(3, 6) },
  { nombre: 'Bebidas', productos: nombres.slice(6, 8) },
]

async function verificarImagenes(page: Page, nombreVista: string) {
  const erroresHttp: string[] = []
  page.on('response', (response) => {
    if (response.url().includes('/images/productos/') && response.status() >= 400) {
      erroresHttp.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto('/')
  for (const categoria of categorias) {
    await page.getByLabel('Categoría').selectOption({ label: categoria.nombre })
    const medidas = []
    for (const nombre of categoria.productos) {
      const imagen = page.getByRole('img', { name: nombre, exact: true })
      await expect(imagen).toBeVisible()
      await imagen.scrollIntoViewIfNeeded()
      await expect.poll(() => imagen.evaluate((elemento) => (elemento as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      medidas.push(await imagen.evaluate((elemento) => {
        const foto = elemento as HTMLImageElement
        return { alt: foto.alt, anchoNatural: foto.naturalWidth,
          alto: foto.getBoundingClientRect().height, ajuste: getComputedStyle(foto).objectFit,
          ruta: foto.getAttribute('src') }
      }))
    }
    for (const medida of medidas) {
      expect(nombres).toContain(medida.alt)
      expect(medida.ruta).not.toContain('sin-imagen.svg')
      expect(medida.anchoNatural).toBeGreaterThan(0)
      expect(medida.alto).toBe(160)
      expect(medida.ajuste).toBe('cover')
    }
    expect(new Set(medidas.map((medida) => medida.alto)).size).toBe(1)
    await page.screenshot({ path: `test-results/catalogo-${nombreVista}-${categoria.nombre.toLowerCase()}.png`, fullPage: true })
  }
  expect(erroresHttp).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

test('fotografías locales en escritorio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await verificarImagenes(page, 'escritorio')
})

test('fotografías locales en celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await verificarImagenes(page, 'celular')
})

test('imagen de respaldo local ante fallo de carga', async ({ page }) => {
  await page.route('**/images/productos/hamburguesa-clasica.jpg', (ruta) => ruta.abort())
  await page.goto('/')
  const imagen = page.getByRole('img', { name: 'Hamburguesa clásica' })
  await expect(imagen).toHaveAttribute('src', '/images/productos/sin-imagen.svg')
  await expect.poll(() => imagen.evaluate((elemento) => (elemento as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
})
