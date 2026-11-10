# backend/seed.py
from database import SessionLocal, engine
import models

# Asegúrate de que las tablas estén creadas
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Lista de motos extraída de la imagen P.V.P ZONA (Bajaj)
motos_data = [
    # MOTO PARA EMPRENDEDORES
    {"marca": "BAJAJ", "modelo": "CT 125", "precio": 4900.00, "categoria": "Utilitaria", "anio": 2026, "descripcion": "Ideal para el trabajo diario."},
    {"marca": "BAJAJ", "modelo": "Boxer Cargo 150X UG Disc", "precio": 5600.00, "categoria": "Utilitaria", "anio": 2026, "descripcion": "Resistente y económica para el trabajo."},
    
    # DISCOVER
    {"marca": "BAJAJ", "modelo": "Discover 125 ST", "precio": 5800.00, "categoria": "Utilitaria", "anio": 2026, "descripcion": "Comodidad y rendimiento."},
    
    # PULSAR
    {"marca": "BAJAJ", "modelo": "Pulsar LS/NS 125", "precio": 6300.00, "categoria": "Naked", "anio": 2026, "descripcion": "Estilo deportivo para la ciudad."},
    {"marca": "BAJAJ", "modelo": "Pulsar N125 Carburada", "precio": 6900.00, "categoria": "Naked", "anio": 2026, "descripcion": "Clásica y confiable."},
    {"marca": "BAJAJ", "modelo": "Pulsar N125FI", "precio": 7400.00, "categoria": "Naked", "anio": 2026, "descripcion": "Inyección electrónica."},
    {"marca": "BAJAJ", "modelo": "Pulsar 150 NEON", "precio": 7600.00, "categoria": "Naked", "anio": 2026, "descripcion": "Diseño llamativo y potencia."},
    {"marca": "BAJAJ", "modelo": "Pulsar 150R", "precio": 8300.00, "categoria": "Naked", "anio": 2026, "descripcion": "La favorita de las pistas urbanas."},
    {"marca": "BAJAJ", "modelo": "Pulsar N160 FI", "precio": 9900.00, "categoria": "Naked", "anio": 2026, "descripcion": "Potencia y tecnología."},
    {"marca": "BAJAJ", "modelo": "Pulsar NS160 ABS UG2", "precio": 11600.00, "categoria": "Naked", "anio": 2026, "descripcion": "Frenado ABS y diseño agresivo."},
    {"marca": "BAJAJ", "modelo": "Pulsar 180 NEON", "precio": 8500.00, "categoria": "Naked", "anio": 2026, "descripcion": "El equilibrio perfecto."},
    {"marca": "BAJAJ", "modelo": "Pulsar NS200 ABS UG2", "precio": 13000.00, "categoria": "Naked", "anio": 2026, "descripcion": "Máximo rendimiento en su categoría."},
    {"marca": "BAJAJ", "modelo": "Pulsar RS200", "precio": 17200.00, "categoria": "Pistera", "anio": 2026, "descripcion": "ADN de superdeportiva."},
    {"marca": "BAJAJ", "modelo": "Pulsar N250 UG", "precio": 15000.00, "categoria": "Naked", "anio": 2026, "descripcion": "Cilindrada superior para expertos."},
    {"marca": "BAJAJ", "modelo": "Pulsar NS400 Z", "precio": 19500.00, "categoria": "Naked", "anio": 2026, "descripcion": "La bestia de la carretera."},
    
    # DOMINAR
    {"marca": "BAJAJ", "modelo": "Dominar 250", "precio": 15800.00, "categoria": "Naked", "anio": 2026, "descripcion": "Potencia y estilo urbano. Motor de 250 cc."},
    {"marca": "BAJAJ", "modelo": "Dominar 400 2.0", "precio": 19500.00, "categoria": "Naked", "anio": 2026, "descripcion": "Máxima potencia touring."},
]

def seed_db():
    # Opcional: Limpiar la tabla antes de insertar para no duplicar
    db.query(models.Moto).delete()
    
    for m in motos_data:
        nueva_moto = models.Moto(
            marca=m["marca"],
            modelo=m["modelo"],
            precio=m["precio"],
            categoria=m["categoria"],
            anio=m["anio"],
            descripcion=m["descripcion"],
            # Asignamos una imagen por defecto (luego deberás cambiarla por las reales)
            imagen="/assets/recursos_imagenes/logo.jpeg",
            estado="DISPONIBLE"
        )
        db.add(nueva_moto)
    
    db.commit()
    print("Base de datos poblada con éxito.")

if __name__ == "__main__":
    seed_db()