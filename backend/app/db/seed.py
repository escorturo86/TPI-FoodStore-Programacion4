from sqlmodel import select
from urllib.parse import urlsplit

from app.core.database import create_all_tables
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.productos.unit_of_work import ProductoUnitOfWork


PRODUCTOS = [
    ("Hamburguesas", "Hamburguesa clásica", 7500, 20),
    ("Hamburguesas", "Hamburguesa doble", 9500, 15),
    ("Hamburguesas", "Hamburguesa vegetariana", 8200, 12),
    ("Pizzas", "Pizza muzzarella", 11000, 18),
    ("Pizzas", "Pizza napolitana", 12500, 14),
    ("Pizzas", "Pizza fugazzeta", 12000, 10),
    ("Bebidas", "Gaseosa", 2500, 30),
    ("Bebidas", "Agua mineral", 1800, 30),
]

IMAGENES = {
    "Hamburguesa clásica": "hamburguesa-clasica.jpg",
    "Hamburguesa doble": "hamburguesa-doble.jpg",
    "Hamburguesa vegetariana": "hamburguesa-vegetariana.jpg",
    "Pizza muzzarella": "pizza-muzzarella.jpg",
    "Pizza napolitana": "pizza-napolitana.jpg",
    "Pizza fugazzeta": "pizza-fugazzeta.jpg",
    "Gaseosa": "gaseosa.jpg",
    "Agua mineral": "agua-mineral.jpg",
}
RUTA_IMAGENES = "/images/productos/"


def es_placeholder(url: str | None) -> bool:
    return bool(url and urlsplit(url).hostname in {"placehold.co", "www.placehold.co"})


def seed() -> None:
    create_all_tables()
    with ProductoUnitOfWork() as uow:
        usuarios = UsuarioRepository(uow.session)
        if usuarios.get_by_username("admin") is None:
            usuarios.add(Usuario(
                username="admin",
                full_name="Administrador Food Store",
                email="admin@foodstore.local",
                hashed_password=hash_password("Admin1234!"),
                role="admin",
            ))

        categorias = {}
        for nombre in ("Hamburguesas", "Pizzas", "Bebidas"):
            categoria = uow.categorias.get_by_nombre(nombre)
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=f"Productos de {nombre.lower()}")
                uow.categorias.add(categoria)
                uow.session.flush()
            categorias[nombre] = categoria

        for categoria_nombre, nombre, precio, stock in PRODUCTOS:
            existe = uow.session.exec(select(Producto).where(Producto.nombre == nombre)).first()
            if existe is None:
                uow.productos.add(Producto(
                    categoria_id=categorias[categoria_nombre].id,
                    nombre=nombre,
                    descripcion=f"{nombre} de Food Store",
                    precio_base=precio,
                    imagen_url=RUTA_IMAGENES + IMAGENES[nombre],
                    stock=stock,
                ))
        # Corrige también filas de ejemplo anteriores, incluidas las inactivas.
        # Nunca reemplaza una URL personalizada ni altera otros campos.
        for producto in uow.session.exec(select(Producto)).all():
            if es_placeholder(producto.imagen_url):
                producto.imagen_url = RUTA_IMAGENES + IMAGENES.get(producto.nombre, "sin-imagen.svg")
    print("Datos iniciales listos")


if __name__ == "__main__":
    seed()
