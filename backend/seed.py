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

# Lista sugerida de precios público (PVP zona), en soles, precio contado.
MOTOS = [
    dict(marca="Bajaj", modelo="CT 125", anio=2026, tipo="Utilitaria", cc=125, precio=6299, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/ct-125.webp"),
    dict(marca="Bajaj", modelo="Boxer Cargo 150X UG Disc", anio=2026, tipo="Utilitaria", cc=150, precio=6002, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/boxer-cargo-150x.webp"),
    dict(marca="Bajaj", modelo="Discover 125 ST", anio=2026, tipo="Urbana", cc=125, precio=7308, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/discover-125-st.webp"),
    dict(marca="Bajaj", modelo="Pulsar LS/NS 125", anio=2026, tipo="Urbana", cc=125, precio=7916, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-ls-ns-125.webp"),
    dict(marca="Bajaj", modelo="Pulsar N125 Carburada", anio=2026, tipo="Naked", cc=125, precio=7436, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-n125-carburada.jpg"),
    dict(marca="Bajaj", modelo="Pulsar N125FI", anio=2026, tipo="Naked", cc=125, precio=8174, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-n125fi.jpg"),
    dict(marca="Bajaj", modelo="Pulsar 150 Neon", anio=2026, tipo="Urbana", cc=150, precio=8032, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-150-neon.webp"),
    dict(marca="Bajaj", modelo="Pulsar 150R", anio=2026, tipo="Urbana", cc=150, precio=8933, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-150r.jpg"),
    dict(marca="Bajaj", modelo="Pulsar N160 FI", anio=2026, tipo="Naked", cc=160, precio=10815, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-n160-fi.webp"),
    dict(marca="Bajaj", modelo="Pulsar NS160 ABS UG2", anio=2026, tipo="Naked", cc=160, precio=12024, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-ns160-abs-ug2.webp"),
    dict(marca="Bajaj", modelo="Pulsar 180 Neon", anio=2026, tipo="Urbana", cc=180, precio=9806, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-180-neon.webp"),
    dict(marca="Bajaj", modelo="Pulsar NS200 ABS UG2", anio=2026, tipo="Naked", cc=200, precio=14266, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-ns200-abs-ug2.webp"),
    dict(marca="Bajaj", modelo="Pulsar RS200", anio=2026, tipo="Deportiva", cc=200, precio=17646, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-rs200.webp"),
    dict(marca="Bajaj", modelo="Pulsar N250 UG", anio=2026, tipo="Naked", cc=250, precio=15357, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-n250-ug.webp"),
    dict(marca="Bajaj", modelo="Pulsar NS400Z", anio=2026, tipo="Naked", cc=373, precio=19866, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/pulsar-ns400z.jpg"),
    dict(marca="Bajaj", modelo="Dominar 250", anio=2026, tipo="Touring", cc=250, precio=16234, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/dominar-250.jpg"),
    dict(marca="Bajaj", modelo="Dominar 400 2.0", anio=2026, tipo="Touring", cc=373, precio=19866, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/dominar-400-2.webp"),
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