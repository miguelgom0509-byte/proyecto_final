from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Moto, Pedido, Usuario
from ..schemas import UsuarioNuevo
from ..security import current_user, hash_password, require

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require("admin"))])


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    por = lambda col: dict(db.execute(select(col, func.count()).group_by(col)).all())
    return {
        "motos": db.scalar(select(func.count()).select_from(Moto).where(Moto.activo.is_(True))),
        "unidades": db.scalar(select(func.coalesce(func.sum(Moto.stock), 0))),
        "pedidos": por(Pedido.estado),
        "usuarios": por(Usuario.rol),
    }


@router.get("/usuarios")
def usuarios(db: Session = Depends(get_db)):
    return [u.public() for u in db.scalars(select(Usuario).order_by(Usuario.id))]


@router.post("/usuarios", status_code=201)
def crear_usuario(data: UsuarioNuevo, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(Usuario).where(Usuario.email == email)):
        raise HTTPException(409, "Ese correo ya está registrado")
    user = Usuario(nombre=data.nombre.strip(), email=email, password_hash=hash_password(data.password), rol=data.rol)
    db.add(user)
    db.commit()
    return user.public()


@router.patch("/usuarios/{user_id}/activo")
def alternar(user_id: int, yo: Usuario = Depends(current_user), db: Session = Depends(get_db)):
    user = db.get(Usuario, user_id)
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user.id == yo.id:
        raise HTTPException(400, "No puedes desactivar tu propia cuenta")
    user.activo = not user.activo
    db.commit()
    return user.public()
