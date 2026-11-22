from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.productos.router import router as productos_router
from app.modules.usuarios.router import router as usuarios_router


settings = get_settings()
app = FastAPI(title="Food Store")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/salud")
def salud() -> dict[str, str]:
    return {"estado": "ok"}


app.include_router(api_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(categorias_router, prefix="/api/v1")
app.include_router(pedidos_router, prefix="/api/v1")
app.include_router(productos_router, prefix="/api/v1")
app.include_router(usuarios_router, prefix="/api/v1")
