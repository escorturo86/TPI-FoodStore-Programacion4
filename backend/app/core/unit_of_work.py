from types import TracebackType
from typing import Callable

from sqlmodel import Session

from app.core.database import session_factory


class UnitOfWork:
    def __init__(self, factory: Callable[[], Session] = session_factory):
        self.factory = factory
        self.session: Session | None = None

    def __enter__(self):
        self.session = self.factory()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> bool:
        if self.session is None:
            return False
        try:
            if exc_type is None:
                try:
                    self.session.commit()
                except Exception:
                    self.session.rollback()
                    raise
            else:
                self.session.rollback()
        finally:
            self.session.close()
            self.session = None
        return False
