"""Datos iniciales de Moto Altiplano.

Se ejecuta al arrancar el servidor (ver main.py) y es idempotente:
solo inserta usuarios o motos si las tablas están vacías.
"""
from sqlalchemy import func, select

from .database import SessionLocal
from .models import Moto, Usuario
from .security import hash_password

USUARIOS = [
    ("Administrador", "admin@motoaltiplano.pe", "Admin12345", "admin"),
    ("Carlos Quispe", "trabajador@motoaltiplano.pe", "Trabajo12345", "trabajador"),
    ("Lucía Mamani", "cliente@motoaltiplano.pe", "Cliente12345", "cliente"),
]

U = "https://images.unsplash.com/"
MOTOS = [
    dict(marca="Honda", modelo="Elite 125", anio=2026, tipo="Scooter", cc=124, precio=2369, moneda="USD", stock=6,
         imagen=U + "photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"),
    dict(marca="Yamaha", modelo="FZS 4.0 ABS Deluxe", anio=2026, tipo="Naked", cc=150, precio=3399, moneda="USD", stock=4,
         imagen=U + "photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop"),
    dict(marca="Bajaj", modelo="Boxer 150X UG Disc", anio=2026, tipo="Utilitaria", cc=150, precio=5432, moneda="PEN", stock=10,
         imagen=U + "photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop"),
    dict(marca="Bajaj", modelo="Dominar 250", anio=2026, tipo="Naked", cc=250, precio=15593, moneda="PEN", stock=3,
         imagen=U + "photo-1558980664-10ea292d4342?q=80&w=800&auto=format&fit=crop"),
    dict(marca="Hero", modelo="Hunk 160R 4V", anio=2027, tipo="Pistera", cc=163, precio=2899, moneda="USD", stock=5,
         imagen=U + "photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"),
]


def seed() -> None:
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(Usuario)):
            for nombre, email, pwd, rol in USUARIOS:
                db.add(Usuario(nombre=nombre, email=email, password_hash=hash_password(pwd), rol=rol))
        if not db.scalar(select(func.count()).select_from(Moto)):
            db.add_all(Moto(**m) for m in MOTOS)
        db.commit()


if __name__ == "__main__":
    from .database import Base, engine
    Base.metadata.create_all(engine)
    seed()
    print("Base de datos poblada con éxito.")