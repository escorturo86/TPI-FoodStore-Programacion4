from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(session, Producto)

    def get_for_update(self, producto_id: int) -> Producto | None:
        query = select(Producto).where(Producto.id == producto_id).with_for_update()
        return self.session.exec(query).first()

    def search(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> list[Producto]:
        query = select(Producto).where(Producto.activo).options(selectinload(Producto.categoria))
        if search:
            query = query.where(Producto.nombre.ilike(f"%{search}%"))
        if categoria_id is not None:
            query = query.where(Producto.categoria_id == categoria_id)
        if disponible is not None:
            query = query.where(Producto.disponible == disponible)
        return list(self.session.exec(query.order_by(Producto.id).offset(skip).limit(limit)).all())

    def count_search(
        self,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> int:
        query = select(func.count()).select_from(Producto).where(Producto.activo)
        if search:
            query = query.where(Producto.nombre.ilike(f"%{search}%"))
        if categoria_id is not None:
            query = query.where(Producto.categoria_id == categoria_id)
        if disponible is not None:
            query = query.where(Producto.disponible == disponible)
        return self.session.exec(query).one()
