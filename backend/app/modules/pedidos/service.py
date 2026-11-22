from datetime import datetime, timedelta, timezone

from app.modules.pedidos.models import DetallePedido, Pedido, fecha_local
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.schemas import UserPublic


TRANSICIONES: dict[str, set[str]] = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),
    "CANCELADO": set(),
}


class PedidoNoEncontrado(Exception):
    pass


class PedidoAjeno(Exception):
    pass


class ReglaPedidoInvalida(Exception):
    pass


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork):
        self.uow = uow

    def crear(self, data: PedidoCreate, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            if len(ids) != len(set(ids)):
                raise ReglaPedidoInvalida("No se puede repetir un producto")
            pedido = Pedido(
                usuario_id=usuario.id,
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega,
                notas=data.notas,
            )
            uow.pedidos.add(pedido)
            uow.session.flush()
            for item in data.items:
                producto = uow.productos.get_for_update(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado("Producto no encontrado")
                if not producto.disponible:
                    raise ReglaPedidoInvalida("Producto no disponible")
                if producto.stock < item.cantidad:
                    raise ReglaPedidoInvalida("Stock insuficiente")
                producto.stock -= item.cantidad
                subtotal = producto.precio_base * item.cantidad
                detalle = DetallePedido(
                    pedido_id=pedido.id,
                    producto_id=producto.id,
                    cantidad=item.cantidad,
                    nombre_producto=producto.nombre,
                    precio_unitario=producto.precio_base,
                    subtotal=subtotal,
                )
                pedido.items.append(detalle)
                pedido.total += subtotal
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    def listar(
        self,
        usuario: UserPublic,
        skip: int,
        limit: int,
        estado: EstadoPedido | None,
    ) -> PedidosPaginados:
        with self.uow as uow:
            usuario_id = None if usuario.role == "admin" else usuario.id
            total, pedidos = uow.pedidos.listar(skip, limit, estado, usuario_id)
            return PedidosPaginados(
                total=total,
                items=[PedidoRead.model_validate(pedido) for pedido in pedidos],
            )

    def obtener(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id)
            self._verificar_dueno_o_admin(pedido, usuario)
            return PedidoRead.model_validate(pedido)

    def cambiar_estado(self, pedido_id: int, data: CambioEstado) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id, bloquear=True)
            self._transicionar(uow, pedido, data.estado)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._obtener(uow, pedido_id, bloquear=True)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            if pedido.estado != "PENDIENTE":
                raise ReglaPedidoInvalida("Solo se puede cancelar un pedido pendiente")
            self._transicionar(uow, pedido, "CANCELADO")
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            zona = timezone(timedelta(hours=-3))
            inicio_local = datetime.now(zona).replace(hour=0, minute=0, second=0, microsecond=0)
            fin_local = inicio_local + timedelta(days=1)
            inicio = inicio_local.replace(tzinfo=None)
            fin = fin_local.replace(tzinfo=None)
            return ResumenPedidos(
                pendientes=uow.pedidos.count_by_estado("PENDIENTE"),
                en_preparacion=uow.pedidos.count_by_estado("EN_PREPARACION"),
                entregados=uow.pedidos.count_by_estado("ENTREGADO"),
                cancelados=uow.pedidos.count_by_estado("CANCELADO"),
                pedidos_hoy=uow.pedidos.count_today(inicio, fin),
                ingresos_entregados=uow.pedidos.ingresos_entregados(),
            )

    @staticmethod
    def _obtener(uow: PedidoUnitOfWork, pedido_id: int, bloquear: bool = False) -> Pedido:
        pedido = uow.pedidos.get_for_update(pedido_id) if bloquear else uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado("Pedido no encontrado")
        return pedido

    @staticmethod
    def _verificar_dueno_o_admin(pedido: Pedido, usuario: UserPublic) -> None:
        if usuario.role != "admin" and pedido.usuario_id != usuario.id:
            raise PedidoAjeno("El pedido pertenece a otro usuario")

    @staticmethod
    def _transicionar(uow: PedidoUnitOfWork, pedido: Pedido, estado: str) -> None:
        if estado not in TRANSICIONES[pedido.estado]:
            raise ReglaPedidoInvalida("Cambio de estado no permitido")
        if estado == "CANCELADO":
            for item in pedido.items:
                producto = uow.productos.get_for_update(item.producto_id)
                producto.stock += item.cantidad
        pedido.estado = estado
        pedido.updated_at = fecha_local()
        uow.session.add(pedido)


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())
