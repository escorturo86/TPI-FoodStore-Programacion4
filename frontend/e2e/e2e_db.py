"""Prepara y limpia solamente la base PostgreSQL local de pruebas E2E."""

import os
import sys
from pathlib import Path

from sqlalchemy import text


backend = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(backend))
os.chdir(backend)

url = os.environ.get("DATABASE_URL", "")
if url != "postgresql://foodstore@localhost:5433/foodstore_test":
    raise SystemExit("E2E solo puede usar la base local foodstore_test")

from app.core.database import engine  # noqa: E402
from app.db.seed import seed  # noqa: E402


def limpiar() -> None:
    with engine.begin() as conexion:
        conexion.execute(text("DELETE FROM detallepedido WHERE pedido_id IN (SELECT id FROM pedido WHERE usuario_id IN (SELECT id FROM usuario WHERE username ~ '^e2e_'))"))
        conexion.execute(text("DELETE FROM pedido WHERE usuario_id IN (SELECT id FROM usuario WHERE username ~ '^e2e_')"))
        conexion.execute(text("DELETE FROM detallepedido WHERE producto_id IN (SELECT id FROM producto WHERE nombre LIKE 'E2E %')"))
        conexion.execute(text("DELETE FROM producto WHERE nombre LIKE 'E2E %'"))
        conexion.execute(text("DELETE FROM categoria WHERE nombre LIKE 'E2E %'"))
        conexion.execute(text("DELETE FROM usuario WHERE username ~ '^e2e_'"))
    print("Datos E2E limpiados en foodstore_test")


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"preparar", "limpiar"}:
        raise SystemExit("Usar preparar o limpiar")
    if sys.argv[1] == "preparar":
        seed()
    limpiar()
