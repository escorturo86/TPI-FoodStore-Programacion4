from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.core.security import create_access_token, hash_password, verify_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    def register(self, data: UserCreate) -> UserPublic:
        try:
            with UsuarioUnitOfWork() as uow:
                if uow.usuarios.get_by_username(data.username) or uow.usuarios.get_by_email(data.email):
                    raise HTTPException(status_code=409, detail="Usuario o email ya registrado")
                user = Usuario(
                    username=data.username,
                    full_name=data.full_name,
                    email=data.email,
                    hashed_password=hash_password(data.password),
                    role="user",
                )
                uow.usuarios.add(user)
                uow.session.flush()
                return UserPublic.model_validate(user)
        except IntegrityError as exc:
            raise HTTPException(status_code=409, detail="Usuario o email ya registrado") from exc

    def login(self, username: str, password: str) -> str:
        with UsuarioUnitOfWork() as uow:
            user = uow.usuarios.get_by_username(username)
            if user is None or not verify_password(password, user.hashed_password):
                raise HTTPException(status_code=401, detail="Credenciales incorrectas")
            if user.disabled:
                raise HTTPException(status_code=400, detail="Cuenta de usuario desactivada")
            return create_access_token(user.username)


def get_auth_service() -> AuthService:
    return AuthService()
