import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import SECRET_KEY, TOKEN_MINUTES
from .database import get_db
from .models import Usuario

bearer = HTTPBearer(auto_error=False)
ITER = 200_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    return f"{salt.hex()}${hashlib.pbkdf2_hmac('sha256', password.encode(), salt, ITER).hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt, digest = stored.split("$")
    calc = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), ITER).hex()
    return hmac.compare_digest(calc, digest)


def create_token(user: Usuario) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINUTES)
    return jwt.encode({"sub": str(user.id), "rol": user.rol, "exp": exp}, SECRET_KEY, algorithm="HS256")


def current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> Usuario:
    if not cred:
        raise HTTPException(401, "Inicia sesión para continuar")
    try:
        data = jwt.decode(cred.credentials, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Tu sesión expiró")
    user = db.get(Usuario, int(data["sub"]))
    if not user or not user.activo:
        raise HTTPException(401, "Usuario inactivo")
    return user


def require(*roles: str):
    def dep(user: Usuario = Depends(current_user)) -> Usuario:
        if user.rol not in roles:
            raise HTTPException(403, "No tienes permisos para esta acción")
        return user
    return dep
