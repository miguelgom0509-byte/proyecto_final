import mimetypes
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Importaciones de tu base de datos y rutas
from .database import Base, engine
from .routers import admin, auth, motos, pedidos
from .seed import seed

# =====================================================================
# 1. ARREGLO PARA WINDOWS: Forzar tipos MIME correctos para CSS y JS
# =====================================================================
# Windows a veces sirve los .css como texto plano y los navegadores los bloquean.
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("image/svg+xml", ".svg")

# =====================================================================
# 2. INICIALIZACIÓN DE LA BASE DE DATOS
# =====================================================================
# Crea las tablas si no existen y carga los datos iniciales (motos, usuarios)
Base.metadata.create_all(engine)
seed()

# =====================================================================
# 3. CREACIÓN DE LA APLICACIÓN FASTAPI
# =====================================================================
app = FastAPI(title="Moto Altiplano API", version="1.0.0")

# Configuración de CORS (el JWT va en la cabecera Authorization, no en cookies,
# por eso allow_credentials=False: con "*" no sería válido activarlo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# 4. REGISTRO DE RUTAS DE LA API (¡Deben ir antes del Frontend!)
# =====================================================================
for r in (auth, motos, pedidos, admin):
    app.include_router(r.router)

@app.get("/api/health", tags=["sistema"])
def health():
    return {"ok": True}

# =====================================================================
# 5. MONTAJE DEL FRONTEND (Debe ser la ÚLTIMA línea de configuración)
# =====================================================================
# La opción html=True le dice a FastAPI que si el usuario entra a "/", 
# busque automáticamente el archivo "index.html" dentro de la carpeta.
ruta_frontend = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=ruta_frontend, html=True), name="web")