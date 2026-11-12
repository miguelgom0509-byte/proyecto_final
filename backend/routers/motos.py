from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Moto, Usuario
from ..schemas import MotoIn, StockIn
from ..security import optional_user, require

router = APIRouter(prefix="/api/motos", tags=["motos"])


def _get(db: Session, moto_id: int) -> Moto:
    moto = db.get(Moto, moto_id)
    if not moto:
        raise HTTPException(404, "Moto no encontrada")
    return moto


@router.get("")
def listar(todas: bool = False, user: Usuario | None = Depends(optional_user), db: Session = Depends(get_db)):
    q = select(Moto).order_by(Moto.marca, Moto.modelo)
    # Las motos dadas de baja solo las ven admin y trabajador
    if not (todas and user and user.rol in ("admin", "trabajador")):
        q = q.where(Moto.activo.is_(True))
    return [m.public() for m in db.scalars(q)]


@router.post("", status_code=201, dependencies=[Depends(require("admin"))])
def crear(data: MotoIn, db: Session = Depends(get_db)):
    moto = Moto(**data.model_dump())
    db.add(moto)
    db.commit()
    return moto.public()


@router.put("/{moto_id}", dependencies=[Depends(require("admin"))])
def actualizar(moto_id: int, data: MotoIn, db: Session = Depends(get_db)):
    moto = _get(db, moto_id)
    for k, v in data.model_dump().items():
        setattr(moto, k, v)
    db.commit()
    return moto.public()


@router.patch("/{moto_id}/stock", dependencies=[Depends(require("admin", "trabajador"))])
def stock(moto_id: int, data: StockIn, db: Session = Depends(get_db)):
    moto = _get(db, moto_id)
    moto.stock = data.stock
    db.commit()
    return moto.public()


@router.delete("/{moto_id}", status_code=204, dependencies=[Depends(require("admin"))])
def eliminar(moto_id: int, db: Session = Depends(get_db)):
    moto = _get(db, moto_id)
    moto.activo = False  # baja lógica: conserva el historial de pedidos
    db.commit()