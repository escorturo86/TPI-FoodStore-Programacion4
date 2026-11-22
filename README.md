# Food Store

Sistema de pedidos de comida desarrollado para el Trabajo Práctico Integrador de Programación 4 (Tecnicatura Universitaria en Programación). Incluye un cliente React y una API FastAPI con PostgreSQL.

## Requisitos

- Python 3.13 (versión usada para comprobar el proyecto) y `pip`.
- Node.js 24 y pnpm 12.18 (versiones usadas). Si pnpm no está instalado, se puede ejecutar mediante `corepack pnpm`.
- PostgreSQL en ejecución y una base vacía a la que pueda conectarse el backend.
- Un navegador moderno. El backend y el frontend se ejecutan en dos terminales distintas.

## Base de datos y backend

Crear una base de PostgreSQL y un usuario con permisos sobre ella. Por ejemplo, desde una consola SQL con permisos de administración:

```sql
CREATE ROLE foodstore LOGIN PASSWORD 'elegir_una_clave_local';
CREATE DATABASE foodstore_db OWNER foodstore;
```

Desde `backend/`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

En macOS o Linux, activar el entorno con `source .venv/bin/activate` y copiar el ejemplo con `cp .env.example .env`.

Editar **solo el archivo local** `backend/.env`:

```dotenv
DATABASE_URL=postgresql://foodstore:CLAVE_LOCAL@localhost:5432/foodstore_db
SECRET_KEY=CLAVE_ALEATORIA_DE_AL_MENOS_32_CARACTERES
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_ORIGIN=http://localhost:5173
```

Sustituir `CLAVE_LOCAL` y `SECRET_KEY` por valores propios. Una clave JWT aleatoria puede generarse con `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Si la contraseña de PostgreSQL contiene caracteres especiales, codificarlos para una URL o elegir una contraseña local sin esos caracteres. Nunca subir `.env` a Git.

Crear las tablas y los datos iniciales, y luego iniciar la API:

```powershell
python -m app.db.seed
uvicorn app.main:app --reload
```

La API queda en <http://localhost:8000/api/v1>. La documentación de endpoints se encuentra en <http://localhost:8000/docs> y <http://localhost:8000/redoc>. El seed puede repetirse sin duplicar los productos iniciales.

## Frontend

Desde otra terminal, en `frontend/`:

```powershell
corepack pnpm install
Copy-Item .env.example .env
corepack pnpm build
corepack pnpm dev
```

En macOS o Linux, copiar el ejemplo con `cp .env.example .env`. Si pnpm ya está disponible, los comandos equivalentes son `pnpm install`, `pnpm build` y `pnpm dev`.

El archivo `frontend/.env` debe contener `VITE_API_URL=http://localhost:8000/api/v1`. Abrir <http://localhost:5173>. El origen de esta URL debe coincidir con `FRONTEND_ORIGIN` del backend para que funcionen las cookies y CORS.

## Usuarios y funciones

El seed crea un administrador **solo para demostración local**: usuario `admin`, contraseña `Admin1234!`. No usar esa contraseña en un despliegue público. Los clientes crean una cuenta desde **Registrarse**.

- Cliente: consultar el catálogo, filtrar productos, mantener el carrito al recargar, confirmar una compra con dirección y pago manual, consultar sus pedidos y cancelar los pendientes.
- Administrador: consultar el resumen, gestionar categorías, productos, stock, pedidos y usuarios. Las bajas de categorías y productos son lógicas.
- El backend controla los permisos y realiza el descuento y la restitución de stock dentro de las transacciones de pedidos.

Las ocho fotografías de ejemplo y la imagen de respaldo son locales. Sus autores, fuentes y licencias están en [`frontend/public/images/productos/FUENTES.md`](frontend/public/images/productos/FUENTES.md).

## Comprobaciones

Desde `backend/`, con el entorno activado, comprobar sintaxis, dependencias y salud de la API:

```powershell
python -m compileall -q app
python -m pip check
```

Con el servidor iniciado, abrir `/docs` y comprobar `GET /api/v1/salud`. Desde `frontend/`, `pnpm build` verifica TypeScript y genera la versión de producción.

El repositorio de desarrollo también contiene controles automatizados con PostgreSQL y Playwright. La suite de Playwright se ejecuta desde `frontend/` con `pnpm exec playwright test`; usa exclusivamente una base local llamada `foodstore_test` en el puerto 5433 y requiere Chromium de Playwright (`pnpm exec playwright install chromium`). La configuración de pruebas prepara y limpia datos en esa base: **no ejecutarla contra la base de desarrollo**. Los controles de PostgreSQL y HTTP adicionales están en `FOODSTORE_CONTROL/QA/`, fuera del paquete académico de revisión.

## Enlaces de la entrega

- Repositorio público de GitHub: [TPI-FoodStore-Programacion4](https://github.com/escorturo86/TPI-FoodStore-Programacion4) (publicación del código pendiente de autorización).
- Video público de demostración (10 a 15 minutos): **pendiente de grabación y URL real**.

Esta versión es de revisión. El enlace del video se incorporará antes de generar y aprobar el paquete definitivo de entrega.
