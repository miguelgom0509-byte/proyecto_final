from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

ROLES = ("admin", "trabajador", "cliente")
ESTADOS = ("pendiente", "en_proceso", "entregado", "cancelado")


class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(20), default="cliente")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    def public(self):
        return {"id": self.id, "nombre": self.nombre, "email": self.email, "rol": self.rol, "activo": self.activo}


class Moto(Base):
    __tablename__ = "motos"
    id: Mapped[int] = mapped_column(primary_key=True)
    marca: Mapped[str] = mapped_column(String(60), index=True)
    modelo: Mapped[str] = mapped_column(String(80))
    anio: Mapped[int] = mapped_column(Integer)
    tipo: Mapped[str] = mapped_column(String(40))
    cc: Mapped[int] = mapped_column(Integer)
    precio: Mapped[float] = mapped_column(Float)
    moneda: Mapped[str] = mapped_column(String(3), default="PEN")
    stock: Mapped[int] = mapped_column(Integer, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    def public(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class Pedido(Base):
    __tablename__ = "pedidos"
    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    moto_id: Mapped[int] = mapped_column(ForeignKey("motos.id"))
    estado: Mapped[str] = mapped_column(String(20), default="pendiente", index=True)
    nota: Mapped[str] = mapped_column(String(300), default="")
    creado: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    cliente: Mapped[Usuario] = relationship()
    moto: Mapped[Moto] = relationship()

    def public(self):
        return {"id": self.id, "estado": self.estado, "nota": self.nota, "creado": self.creado,
                "cliente": self.cliente.nombre, "moto": f"{self.moto.marca} {self.moto.modelo}", "moto_id": self.moto_id}
