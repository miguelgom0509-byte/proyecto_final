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

# Bajaj: lista sugerida de precios público Zona 4 (Cusco, Puno y Madre de Dios), noviembre 2026.
#   precio = precio lista · bono = bono de la marca · precio_tarjeta = precio final solo con tarjeta.
# Polux y Rezzio: precio publicado al 16-11-2026. Aún sin foto propia: se usa SIN_FOTO.
SIN_FOTO = "/recursos/image/motos/proximamente.svg"
MOTOS = [
    dict(marca="Bajaj", modelo="CT 125", anio=2026, tipo="Utilitaria", cc=125, precio=6299, moneda="PEN", stock=5,
         bono=1050, precio_tarjeta=4900, precio_nota="", imagen="/recursos/image/motos/ct-125.webp"),
    dict(marca="Bajaj", modelo="Boxer Cargo 150X UG Disc", anio=2026, tipo="Utilitaria", cc=150, precio=6002, moneda="PEN", stock=5,
         bono=None, precio_tarjeta=5600, precio_nota="", imagen="/recursos/image/motos/boxer-cargo-150x.webp"),
    dict(marca="Bajaj", modelo="Discover 125 ST", anio=2026, tipo="Urbana", cc=125, precio=7308, moneda="PEN", stock=5,
         bono=1100, precio_tarjeta=5800, precio_nota="", imagen="/recursos/image/motos/discover-125-st.webp"),
    dict(marca="Bajaj", modelo="Pulsar LS/NS 125", anio=2026, tipo="Urbana", cc=125, precio=7916, moneda="PEN", stock=5,
         bono=1250, precio_tarjeta=6300, precio_nota="", imagen="/recursos/image/motos/pulsar-ls-ns-125.webp"),
    dict(marca="Bajaj", modelo="Pulsar N125 Carburada", anio=2026, tipo="Naked", cc=125, precio=7436, moneda="PEN", stock=5,
         bono=200, precio_tarjeta=6900, precio_nota="", imagen="/recursos/image/motos/pulsar-n125-carburada.jpg"),
    dict(marca="Bajaj", modelo="Pulsar N125FI", anio=2026, tipo="Naked", cc=125, precio=8174, moneda="PEN", stock=5,
         bono=400, precio_tarjeta=7400, precio_nota="", imagen="/recursos/image/motos/pulsar-n125fi.jpg"),
    dict(marca="Bajaj", modelo="Pulsar 150 Neon", anio=2026, tipo="Urbana", cc=150, precio=8032, moneda="PEN", stock=5,
         bono=None, precio_tarjeta=7600, precio_nota="", imagen="/recursos/image/motos/pulsar-150-neon.webp"),
    dict(marca="Bajaj", modelo="Pulsar 150R", anio=2026, tipo="Urbana", cc=150, precio=8933, moneda="PEN", stock=5,
         bono=300, precio_tarjeta=8300, precio_nota="", imagen="/recursos/image/motos/pulsar-150r.jpg"),
    dict(marca="Bajaj", modelo="Pulsar N160 FI", anio=2026, tipo="Naked", cc=160, precio=10815, moneda="PEN", stock=5,
         bono=500, precio_tarjeta=9900, precio_nota="S/ 9,750 solo en color rojo", imagen="/recursos/image/motos/pulsar-n160-fi.webp"),
    dict(marca="Bajaj", modelo="Pulsar NS160 ABS UG2", anio=2026, tipo="Naked", cc=160, precio=12024, moneda="PEN", stock=5,
         bono=850, precio_tarjeta=10800, precio_nota="", imagen="/recursos/image/motos/pulsar-ns160-abs-ug2.webp"),
    dict(marca="Bajaj", modelo="Pulsar 180 Neon", anio=2026, tipo="Urbana", cc=180, precio=9806, moneda="PEN", stock=5,
         bono=900, precio_tarjeta=8500, precio_nota="", imagen="/recursos/image/motos/pulsar-180-neon.webp"),
    dict(marca="Bajaj", modelo="Pulsar NS200 ABS UG2", anio=2026, tipo="Naked", cc=200, precio=14266, moneda="PEN", stock=5,
         bono=900, precio_tarjeta=13000, precio_nota="", imagen="/recursos/image/motos/pulsar-ns200-abs-ug2.webp"),
    dict(marca="Bajaj", modelo="Pulsar RS200", anio=2026, tipo="Deportiva", cc=200, precio=17646, moneda="PEN", stock=5,
         bono=None, precio_tarjeta=17200, precio_nota="", imagen="/recursos/image/motos/pulsar-rs200.webp"),
    dict(marca="Bajaj", modelo="Pulsar N250 UG", anio=2026, tipo="Naked", cc=250, precio=15357, moneda="PEN", stock=5,
         bono=None, precio_tarjeta=15000, precio_nota="", imagen="/recursos/image/motos/pulsar-n250-ug.webp"),
    dict(marca="Bajaj", modelo="Pulsar NS400Z", anio=2026, tipo="Naked", cc=373, precio=19866, moneda="PEN", stock=5,
         bono=None, precio_tarjeta=19500, precio_nota="", imagen="/recursos/image/motos/pulsar-ns400z.jpg"),
    dict(marca="Bajaj", modelo="Dominar 250", anio=2026, tipo="Touring", cc=250, precio=16234, moneda="PEN", stock=5,
         bono=1200, precio_tarjeta=14600, precio_nota="", imagen="/recursos/image/motos/dominar-250.jpg"),
    dict(marca="Bajaj", modelo="Dominar 400 2.0", anio=2026, tipo="Touring", cc=373, precio=19866, moneda="PEN", stock=5,
         bono=1900, precio_tarjeta=17600, precio_nota="", imagen="/recursos/image/motos/dominar-400-2.webp"),
    dict(marca="Polux", modelo="FMJ250P", anio=2026, tipo="Carguero", cc=250, precio=7800, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/fmj250p.webp"),
    dict(marca="Polux", modelo="Tanke 350P", anio=2026, tipo="Carguero", cc=350, precio=11500, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/tanke-350p.webp"),
    dict(marca="Polux", modelo="Full 400P", anio=2026, tipo="Carguero", cc=400, precio=15200, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/full-400p.webp"),
    dict(marca="Polux", modelo="FMJ330P Carguero", anio=2026, tipo="Carguero", cc=330, precio=7900, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/fmj330p.webp"),
    dict(marca="Polux", modelo="FMS260P Carguero Selvático", anio=2026, tipo="Carguero", cc=260, precio=8000, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/fms260p.webp"),
    dict(marca="Polux", modelo="Jungla 350P", anio=2026, tipo="Carguero", cc=350, precio=11350, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Raptor 400 Cuatricarga", anio=2026, tipo="Carguero", cc=400, precio=16200, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/raptor-400.webp"),
    dict(marca="Polux", modelo="Venom 250 Max 250Pi", anio=2026, tipo="Pistera", cc=250, precio=7200, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/venom-250-max.webp"),
    dict(marca="Polux", modelo="Venom Max 400P", anio=2026, tipo="Pistera", cc=400, precio=9300, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/venom-max-400p.webp"),
    dict(marca="Polux", modelo="Vemon 400 P", anio=2026, tipo="Pistera", cc=400, precio=9000, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/vemon-400p.webp"),
    dict(marca="Polux", modelo="Venom 250P", anio=2026, tipo="Pistera", cc=250, precio=7500, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/venom-250p.webp"),
    dict(marca="Polux", modelo="Kripton 250P Antigua", anio=2026, tipo="Pistera", cc=250, precio=5200, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/kripton-250p.webp"),
    dict(marca="Polux", modelo="Logan 200P", anio=2026, tipo="Pistera", cc=200, precio=5100, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/logan-200p.webp"),
    dict(marca="Polux", modelo="Ken 200P", anio=2026, tipo="Pistera", cc=200, precio=5100, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/ken-200p.webp"),
    dict(marca="Polux", modelo="Iron 250P 2024", anio=2026, tipo="Pistera", cc=250, precio=6700, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Spirit 200P", anio=2026, tipo="Pistera", cc=200, precio=5200, moneda="PEN", stock=5,
         imagen="/recursos/image/motos/spirit-200p.webp"),
    dict(marca="Polux", modelo="Z400P", anio=2026, tipo="Pistera", cc=400, precio=9000, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Vio 150P", anio=2026, tipo="Urbana", cc=150, precio=3150, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Jumax 150P", anio=2026, tipo="Urbana", cc=150, precio=3200, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Diva 125P", anio=2026, tipo="Urbana", cc=125, precio=2500, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Jawar 200P", anio=2026, tipo="Urbana", cc=200, precio=4100, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Yango 150 P", anio=2026, tipo="Urbana", cc=150, precio=2900, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Nero 150P", anio=2026, tipo="Urbana", cc=150, precio=2900, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Bizon 200P", anio=2026, tipo="Todo terreno", cc=200, precio=3750, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Terran 200P", anio=2026, tipo="Todo terreno", cc=200, precio=3200, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="BZX 200P", anio=2026, tipo="Todo terreno", cc=200, precio=3900, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="GTS 250P", anio=2026, tipo="Todo terreno", cc=250, precio=6100, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="GTS 300Pi", anio=2026, tipo="Todo terreno", cc=300, precio=8800, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Ranger 200 P", anio=2026, tipo="Todo terreno", cc=200, precio=3900, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Ranger 250 P", anio=2026, tipo="Todo terreno", cc=250, precio=4100, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Xram 200P", anio=2026, tipo="Todo terreno", cc=200, precio=3300, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Max 200P", anio=2026, tipo="Todo terreno", cc=200, precio=3900, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="SR 250P", anio=2026, tipo="Todo terreno", cc=250, precio=6600, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Gol 150P", anio=2026, tipo="Todo terreno", cc=150, precio=2900, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Way 125P", anio=2026, tipo="Todo terreno", cc=125, precio=3000, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Prisma 150P", anio=2026, tipo="Todo terreno", cc=150, precio=3600, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="Zeta 400P", anio=2026, tipo="Todo terreno", cc=400, precio=9050, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Polux", modelo="ZF 200P", anio=2026, tipo="Todo terreno", cc=200, precio=5600, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Rezzio", modelo="RZ200 Velox", anio=2026, tipo="Todo terreno", cc=200, precio=4450, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
    dict(marca="Rezzio", modelo="RZ250-FMX", anio=2026, tipo="Todo terreno", cc=250, precio=4400, moneda="PEN", stock=5,
         imagen=SIN_FOTO),
]


def seed() -> None:
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(Usuario)):
            for nombre, email, pwd, rol in USUARIOS:
                db.add(Usuario(nombre=nombre, email=email, password_hash=hash_password(pwd), rol=rol))
        if not db.scalar(select(func.count()).select_from(Moto)):
            db.add_all(Moto(**m) for m in MOTOS)
        else:
            db.query(Moto).filter(Moto.marca == "Importada").update({"marca": "Polux"})  # nombre anterior
            # Base existente: se agregan las motos que falten y se completan bono / precio tarjeta
            # (sin pisar precios ni stock que el administrador ya haya cambiado).
            for m in MOTOS:
                ex = db.scalar(select(Moto).where(Moto.marca == m["marca"], Moto.modelo == m["modelo"]))
                if ex is None:
                    db.add(Moto(**m))
                elif ex.imagen.endswith("proximamente.svg") and m["imagen"] != SIN_FOTO:
                    ex.imagen = m["imagen"]
                elif ex.precio_tarjeta is None and m.get("precio_tarjeta"):
                    ex.bono = m.get("bono"); ex.precio_tarjeta = m["precio_tarjeta"]
                    ex.precio_nota = m.get("precio_nota", "")
        db.commit()


if __name__ == "__main__":
    from .database import Base, engine
    Base.metadata.create_all(engine)
    seed()
    print("Base de datos poblada con éxito.")