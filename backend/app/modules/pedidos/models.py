from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


def fecha_local() -> datetime:
    zona = timezone(timedelta(hours=-3))
    return datetime.now(zona).replace(tzinfo=None)


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    estado: str = "PENDIENTE"
    forma_pago: str
    direccion_entrega: str
    notas: str | None = None
    total: float = 0
    created_at: datetime = Field(default_factory=fecha_local)
    updated_at: datetime = Field(default_factory=fecha_local)

    usuario: "Usuario" = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(back_populates="pedido")


class DetallePedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")
    cantidad: int = Field(ge=1)
    nombre_producto: str
    precio_unitario: float = Field(ge=0)
    subtotal: float = Field(ge=0)

    pedido: "Pedido" = Relationship(back_populates="items")
    producto: "Producto" = Relationship(back_populates="detalles")
