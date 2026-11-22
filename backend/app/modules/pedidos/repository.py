from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def list_by_usuario(self, usuario_id: int) -> list[Pedido]:
        return list(self.session.exec(select(Pedido).where(Pedido.usuario_id == usuario_id)).all())

    def get_for_update(self, pedido_id: int) -> Pedido | None:
        return self.session.exec(select(Pedido).where(Pedido.id == pedido_id).with_for_update()).first()

    def listar(
        self,
        skip: int,
        limit: int,
        estado: str | None,
        usuario_id: int | None,
    ) -> tuple[int, list[Pedido]]:
        filtros = []
        if estado is not None:
            filtros.append(Pedido.estado == estado)
        if usuario_id is not None:
            filtros.append(Pedido.usuario_id == usuario_id)
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*filtros)).one()
        query = (
            select(Pedido)
            .where(*filtros)
            .options(selectinload(Pedido.items))
            .order_by(Pedido.id.desc())
            .offset(skip)
            .limit(limit)
        )
        return total, list(self.session.exec(query).all())

    def count_by_estado(self, estado: str) -> int:
        return self.session.exec(select(func.count()).select_from(Pedido).where(Pedido.estado == estado)).one()

    def count_today(self, inicio: datetime, fin: datetime) -> int:
        query = select(func.count()).select_from(Pedido).where(Pedido.created_at >= inicio, Pedido.created_at < fin)
        return self.session.exec(query).one()

    def ingresos_entregados(self) -> float:
        query = select(func.coalesce(func.sum(Pedido.total), 0.0)).where(Pedido.estado == "ENTREGADO")
        return float(self.session.exec(query).one())
