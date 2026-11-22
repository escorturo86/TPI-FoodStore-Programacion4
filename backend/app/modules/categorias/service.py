from sqlalchemy.exc import IntegrityError

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork):
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(item) for item in uow.categorias.list_active()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._activa(uow, categoria_id)
            return CategoriaRead.model_validate(categoria)

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        try:
            with self.uow as uow:
                if uow.categorias.get_by_nombre(data.nombre) is not None:
                    raise NombreDuplicado("Ya existe una categoría con ese nombre")
                categoria = Categoria.model_validate(data)
                uow.categorias.add(categoria)
                uow.session.flush()
                return CategoriaRead.model_validate(categoria)
        except IntegrityError as exc:
            raise NombreDuplicado("Ya existe una categoría con ese nombre") from exc

    def actualizar(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        try:
            with self.uow as uow:
                categoria = self._activa(uow, categoria_id)
                cambios = data.model_dump(exclude_unset=True)
                nombre = cambios.get("nombre")
                if nombre is not None:
                    existente = uow.categorias.get_by_nombre(nombre)
                    if existente is not None and existente.id != categoria_id:
                        raise NombreDuplicado("Ya existe una categoría con ese nombre")
                for campo, valor in cambios.items():
                    setattr(categoria, campo, valor)
                uow.session.add(categoria)
                return CategoriaRead.model_validate(categoria)
        except IntegrityError as exc:
            raise NombreDuplicado("Ya existe una categoría con ese nombre") from exc

    def desactivar(self, categoria_id: int) -> None:
        with self.uow as uow:
            categoria = self._activa(uow, categoria_id)
            categoria.activo = False
            uow.session.add(categoria)

    @staticmethod
    def _activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada("Categoría no encontrada")
        return categoria


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())
