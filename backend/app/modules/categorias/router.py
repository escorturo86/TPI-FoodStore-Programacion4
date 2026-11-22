from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    NombreDuplicado,
    get_categoria_service,
)
from app.modules.usuarios.schemas import UserPublic


router = APIRouter(prefix="/categorias", tags=["Categorías"])
admin = require_role(["admin"])


def traducir_error(exc: Exception) -> None:
    if isinstance(exc, CategoriaNoEncontrada):
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if isinstance(exc, NombreDuplicado):
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    raise exc


@router.get("", response_model=list[CategoriaRead])
def listar(service: CategoriaService = Depends(get_categoria_service)) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener(
    categoria_id: int,
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada as exc:
        traducir_error(exc)


@router.post("", response_model=CategoriaRead, status_code=201)
def crear(
    data: CategoriaCreate,
    _: UserPublic = Depends(admin),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.crear(data)
    except NombreDuplicado as exc:
        traducir_error(exc)


@router.put("/{categoria_id}", response_model=CategoriaRead)
def actualizar(
    categoria_id: int,
    data: CategoriaUpdate,
    _: UserPublic = Depends(admin),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.actualizar(categoria_id, data)
    except (CategoriaNoEncontrada, NombreDuplicado) as exc:
        traducir_error(exc)


@router.delete("/{categoria_id}", status_code=204)
def desactivar(
    categoria_id: int,
    _: UserPublic = Depends(admin),
    service: CategoriaService = Depends(get_categoria_service),
) -> None:
    try:
        service.desactivar(categoria_id)
    except CategoriaNoEncontrada as exc:
        traducir_error(exc)
