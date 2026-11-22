from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ReglaPedidoInvalida,
    get_pedido_service,
)
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.schemas import UserPublic


router = APIRouter(prefix="/pedidos", tags=["Pedidos"])
admin = require_role(["admin"])


def traducir_error(exc: Exception) -> None:
    if isinstance(exc, (PedidoNoEncontrado, ProductoNoEncontrado)):
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if isinstance(exc, PedidoAjeno):
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    if isinstance(exc, ReglaPedidoInvalida):
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    raise exc


@router.post("", response_model=PedidoRead, status_code=201)
def crear(
    data: PedidoCreate,
    usuario: UserPublic = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.crear(data, usuario)
    except (ProductoNoEncontrado, ReglaPedidoInvalida) as exc:
        traducir_error(exc)


@router.get("", response_model=PedidosPaginados)
def listar(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    estado: EstadoPedido | None = None,
    usuario: UserPublic = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidosPaginados:
    return service.listar(usuario, skip, limit, estado)


@router.get("/resumen", response_model=ResumenPedidos)
def resumen(
    _: UserPublic = Depends(admin),
    service: PedidoService = Depends(get_pedido_service),
) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead)
def obtener(
    pedido_id: int,
    usuario: UserPublic = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except (PedidoNoEncontrado, PedidoAjeno) as exc:
        traducir_error(exc)


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def cambiar_estado(
    pedido_id: int,
    data: CambioEstado,
    _: UserPublic = Depends(admin),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, data)
    except (PedidoNoEncontrado, ReglaPedidoInvalida) as exc:
        traducir_error(exc)


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancelar(
    pedido_id: int,
    usuario: UserPublic = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except (PedidoNoEncontrado, PedidoAjeno, ReglaPedidoInvalida) as exc:
        traducir_error(exc)
