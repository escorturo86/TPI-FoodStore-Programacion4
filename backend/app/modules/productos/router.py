from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.deps import require_role
from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoNoEncontrado, ProductoService, get_producto_service
from app.modules.usuarios.schemas import UserPublic


router = APIRouter(prefix="/productos", tags=["Productos"])
admin = require_role(["admin"])


def traducir_error(exc: Exception) -> None:
    if isinstance(exc, (ProductoNoEncontrado, CategoriaNoEncontrada)):
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    raise exc


@router.get("", response_model=ProductosPaginados)
def listar(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    categoria_id: int | None = None,
    disponible: bool | None = None,
    service: ProductoService = Depends(get_producto_service),
) -> ProductosPaginados:
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener(
    producto_id: int,
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.obtener(producto_id)
    except ProductoNoEncontrado as exc:
        traducir_error(exc)


@router.post("", response_model=ProductoRead, status_code=201)
def crear(
    data: ProductoCreate,
    _: UserPublic = Depends(admin),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.crear(data)
    except CategoriaNoEncontrada as exc:
        traducir_error(exc)


@router.put("/{producto_id}", response_model=ProductoRead)
def actualizar(
    producto_id: int,
    data: ProductoUpdate,
    _: UserPublic = Depends(admin),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.actualizar(producto_id, data)
    except (ProductoNoEncontrado, CategoriaNoEncontrada) as exc:
        traducir_error(exc)


@router.patch("/{producto_id}/stock", response_model=ProductoRead)
def cambiar_stock(
    producto_id: int,
    data: ProductoStockUpdate,
    _: UserPublic = Depends(admin),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.cambiar_stock(producto_id, data)
    except ProductoNoEncontrado as exc:
        traducir_error(exc)


@router.delete("/{producto_id}", status_code=204)
def desactivar(
    producto_id: int,
    _: UserPublic = Depends(admin),
    service: ProductoService = Depends(get_producto_service),
) -> None:
    try:
        service.desactivar(producto_id)
    except ProductoNoEncontrado as exc:
        traducir_error(exc)
