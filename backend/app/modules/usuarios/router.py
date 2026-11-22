from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService, get_usuario_service


router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])
admin = require_role(["admin"])


@router.get("", response_model=list[UserPublic])
def listar(
    _: UserPublic = Depends(admin),
    service: UsuarioService = Depends(get_usuario_service),
) -> list[UserPublic]:
    return service.listar()


@router.post("/{user_id}/activar", response_model=UserPublic)
def activar(
    user_id: int,
    current: UserPublic = Depends(admin),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    return service.cambiar_estado(user_id, False, current.id)


@router.post("/{user_id}/desactivar", response_model=UserPublic)
def desactivar(
    user_id: int,
    current: UserPublic = Depends(admin),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    return service.cambiar_estado(user_id, True, current.id)
