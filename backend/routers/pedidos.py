from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Moto, Pedido, Usuario
from ..schemas import EstadoIn, PedidoIn
from ..security import require

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])


@router.post("", status_code=201)
def crear(data: PedidoIn, user: Usuario = Depends(require("cliente")), db: Session = Depends(get_db)):
    moto = db.get(Moto, data.moto_id)
    if not moto or not moto.activo:
        raise HTTPException(404, "Moto no disponible")
    if moto.stock < 1:
        raise HTTPException(409, "Esta moto no tiene stock por ahora")
    pedido = Pedido(cliente_id=user.id, moto_id=moto.id, nota=data.nota.strip())
    db.add(pedido)
    db.commit()
    return pedido.public()


@router.get("/mios")
def mios(user: Usuario = Depends(require("cliente")), db: Session = Depends(get_db)):
    q = select(Pedido).where(Pedido.cliente_id == user.id).order_by(Pedido.id.desc())
    return [p.public() for p in db.scalars(q)]


@router.get("", dependencies=[Depends(require("admin", "trabajador"))])
def todos(estado: str | None = None, db: Session = Depends(get_db)):
    q = select(Pedido).order_by(Pedido.id.desc())
    if estado:
        q = q.where(Pedido.estado == estado)
    return [p.public() for p in db.scalars(q)]


@router.patch("/{pedido_id}/estado", dependencies=[Depends(require("admin", "trabajador"))])
def cambiar_estado(pedido_id: int, data: EstadoIn, db: Session = Depends(get_db)):
    pedido = db.get(Pedido, pedido_id)
    if not pedido:
        raise HTTPException(404, "Pedido no encontrado")
    if data.estado == "entregado" and pedido.estado != "entregado":
        if pedido.moto.stock < 1:
            raise HTTPException(409, "No hay stock para entregar esta moto")
        pedido.moto.stock -= 1
    elif pedido.estado == "entregado" and data.estado != "entregado":
        pedido.moto.stock += 1  # se revierte la entrega: la unidad vuelve al inventario
    pedido.estado = data.estado
    db.commit()
    return pedido.public()