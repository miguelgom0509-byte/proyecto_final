"""Datos iniciales. Cambia estas contraseñas antes de publicar."""
from sqlalchemy import func, select

from .database import SessionLocal
from .models import Moto, Usuario
from .security import hash_password

USUARIOS = [
    ("Administrador", "admin@motoaltiplano.pe", "Admin12345", "admin"),
    ("Carlos Quispe", "trabajador@motoaltiplano.pe", "Trabajo12345", "trabajador"),
    ("Lucía Mamani", "cliente@motoaltiplano.pe", "Cliente12345", "cliente"),
]
MOTOS = [
    ("Honda", "Elite 125", 2026, "Scooter", 124, 2369, "USD", 6),
    ("Yamaha", "FZS 4.0 ABS Deluxe", 2026, "Naked", 150, 3399, "USD", 4),
    ("Bajaj", "Boxer 150X UG Disc", 2026, "Utilitaria", 150, 5432, "PEN", 10),
    ("Bajaj", "Dominar 250", 2026, "Naked", 250, 15593, "PEN", 3),
    ("Hero", "Hunk 160R 4V", 2027, "Pistera", 163, 2899, "USD", 5),
]


def seed():
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(Usuario)):
            for n, e, p, r in USUARIOS:
                db.add(Usuario(nombre=n, email=e, password_hash=hash_password(p), rol=r))
        if not db.scalar(select(func.count()).select_from(Moto)):
            for m, mo, a, t, cc, pr, cu, st in MOTOS:
                db.add(Moto(marca=m, modelo=mo, anio=a, tipo=t, cc=cc, precio=pr, moneda=cu, stock=st))
        db.commit()
