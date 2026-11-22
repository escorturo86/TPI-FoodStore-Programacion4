from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import get_settings
from app.core.deps import get_current_active_user
from app.modules.auth.schemas import LoginMessage
from app.modules.auth.service import AuthService, get_auth_service
from app.modules.usuarios.schemas import UserCreate, UserPublic


router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=UserPublic, status_code=201)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)) -> UserPublic:
    return service.register(data)


@router.post("/token", response_model=LoginMessage)
def login(
    response: Response,
    form: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
) -> LoginMessage:
    token = service.login(form.username, form.password)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=get_settings().access_token_expire_minutes * 60,
    )
    return LoginMessage(message="Login exitoso")


@router.post("/logout", response_model=LoginMessage)
def logout(response: Response) -> LoginMessage:
    response.delete_cookie("access_token")
    return LoginMessage(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic)
def me(user: UserPublic = Depends(get_current_active_user)) -> UserPublic:
    return user
