from app.modules.categorias.models import Categoria
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    pass


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork):
        self.uow = uow

    def listar(
        self,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            productos = uow.productos.search(skip, limit, search, categoria_id, disponible)
            total = uow.productos.count_search(search, categoria_id, disponible)
            return ProductosPaginados(
                total=total,
                items=[ProductoRead.model_validate(item) for item in productos],
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            return ProductoRead.model_validate(producto)

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            categoria = self._categoria_activa(uow, data.categoria_id)
            producto = Producto.model_validate(data)
            producto.categoria = categoria
            uow.productos.add(producto)
            uow.session.flush()
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            cambios = data.model_dump(exclude_unset=True)
            if "categoria_id" in cambios:
                producto.categoria = self._categoria_activa(uow, cambios.pop("categoria_id"))
            for campo, valor in cambios.items():
                setattr(producto, campo, valor)
            uow.session.add(producto)
            uow.session.flush()
            return ProductoRead.model_validate(producto)

    def cambiar_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            producto.stock = data.stock
            producto.disponible = data.disponible
            uow.session.add(producto)
            return ProductoRead.model_validate(producto)

    def desactivar(self, producto_id: int) -> None:
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            producto.activo = False
            uow.session.add(producto)

    @staticmethod
    def _activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado("Producto no encontrado")
        return producto

    @staticmethod
    def _categoria_activa(uow: ProductoUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria


def get_producto_service() -> ProductoService:
    return ProductoService(ProductoUnitOfWork())
