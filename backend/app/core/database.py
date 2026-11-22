from sqlmodel import SQLModel, Session, create_engine

from app.core.config import get_settings
from app.modules.categorias import models as categorias_models  # noqa: F401
from app.modules.pedidos import models as pedidos_models  # noqa: F401
from app.modules.productos import models as productos_models  # noqa: F401
from app.modules.usuarios import models as usuarios_models  # noqa: F401


engine = create_engine(get_settings().database_url, pool_pre_ping=True)


def session_factory() -> Session:
    return Session(engine, expire_on_commit=False)


def create_all_tables() -> None:
    SQLModel.metadata.create_all(engine)
