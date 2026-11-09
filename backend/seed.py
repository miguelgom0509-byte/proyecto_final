from sqlalchemy import func, select
from .database import SessionLocal
from .models import Moto, Usuario
from .security import hash_password

USUARIOS = [
    ("Administrador", "admin@motoaltiplano.pe", "Admin12345", "admin"),
    ("Carlos Quispe", "trabajador@motoaltiplano.pe", "Trabajo12345", "trabajador"),
    ("Lucía Mamani", "cliente@motoaltiplano.pe", "Cliente12345", "cliente"),
]
# (Marca, Modelo, Año, Tipo, CC, Precio, Moneda, Stock, URL Imagen)
MOTOS = [
    ("Honda", "Elite 125", 2026, "Scooter", 124, 2369, "USD", 6, "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"),
    ("Yamaha", "FZS 4.0 ABS Deluxe", 2026, "Naked", 150, 3399, "USD", 4, "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop"),
    ("Bajaj", "Boxer 150X UG Disc", 2026, "Utilitaria", 150, 5432, "PEN", 10, "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=800&auto=format&fit=crop"),
    ("Bajaj", "Dominar 250", 2026, "Naked", 250, 15593, "PEN", 3, "https://images.unsplash.com/photo-1558980664-10ea292d4342?q=80&w=800&auto=format&fit=crop"),
    ("Hero", "Hunk 160R 4V", 2027, "Pistera", 163, 2899, "USD", 5, "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"),
]

def seed():
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(Usuario)):
            for n, e, p, r in USUARIOS:
                db.add(Usuario(nombre=n, email=e, password_hash=hash_password(p), rol=r))
        if not db.scalar(select(func.count()).select_from(Moto)):
            for m, mo, a, t, cc, pr, cu, st, img in MOTOS:
                db.add(Moto(marca=m, modelo=mo, anio=a, tipo=t, cc=cc, precio=pr, moneda=cu, stock=st, imagen=img))
        db.commit()