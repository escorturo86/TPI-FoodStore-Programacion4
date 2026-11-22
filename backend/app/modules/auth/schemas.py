from sqlmodel import SQLModel


class LoginMessage(SQLModel):
    message: str
