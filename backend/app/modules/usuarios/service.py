from fastapi import HTTPException

from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    def listar(self) -> list[UserPublic]:
        with UsuarioUnitOfWork() as uow:
            return [UserPublic.model_validate(user) for user in uow.usuarios.get_all()]

    def cambiar_estado(self, user_id: int, disabled: bool, admin_id: int) -> UserPublic:
        with UsuarioUnitOfWork() as uow:
            user = uow.usuarios.get_by_id(user_id)
            if user is None:
                raise HTTPException(status_code=404, detail="Usuario no encontrado")
            if disabled and user.id == admin_id:
                raise HTTPException(status_code=400, detail="No puede desactivar su propia cuenta")
            user.disabled = disabled
            uow.session.add(user)
            return UserPublic.model_validate(user)


def get_usuario_service() -> UsuarioService:
    return UsuarioService()
