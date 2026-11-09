from pydantic import BaseModel, Field

EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$"


class Login(BaseModel):
    email: str = Field(pattern=EMAIL)
    password: str


class Registro(BaseModel):
    nombre: str = Field(min_length=3, max_length=120)
    email: str = Field(pattern=EMAIL)
    password: str = Field(min_length=8, max_length=128)


class UsuarioNuevo(Registro):
    rol: str = Field(pattern="^(admin|trabajador|cliente)$")


class MotoIn(BaseModel):
    marca: str = Field(min_length=2, max_length=60)
    modelo: str = Field(min_length=1, max_length=80)
    anio: int = Field(ge=2000, le=2100)
    tipo: str = Field(min_length=2, max_length=40)
    cc: int = Field(gt=0, le=3000)
    precio: float = Field(gt=0)
    moneda: str = Field(default="PEN", pattern="^(PEN|USD)$")
    stock: int = Field(default=0, ge=0)
    activo: bool = True


class StockIn(BaseModel):
    stock: int = Field(ge=0)


class PedidoIn(BaseModel):
    moto_id: int
    nota: str = Field(default="", max_length=300)


class EstadoIn(BaseModel):
    estado: str = Field(pattern="^(pendiente|en_proceso|entregado|cancelado)$")
