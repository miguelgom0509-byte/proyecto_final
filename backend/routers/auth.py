from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..schemas import Login, Registro
from ..security import create_token, current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(data: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(Usuario).where(Usuario.email == data.email.lower()))
    if not user or not user.activo or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos")
    return {"token": create_token(user), "usuario": user.public()}


@router.post("/registro", status_code=201)
def registro(data: Registro, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(Usuario).where(Usuario.email == email)):
        raise HTTPException(409, "Ese correo ya está registrado")
    user = Usuario(nombre=data.nombre.strip(), email=email, password_hash=hash_password(data.password), rol="cliente")
    db.add(user)
    db.commit()
    return {"token": create_token(user), "usuario": user.public()}


@router.get("/me")
def me(user: Usuario = Depends(current_user)):
    return user.public()
