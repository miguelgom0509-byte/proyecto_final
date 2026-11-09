import mimetypes
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import admin, auth, motos, pedidos
from .seed import seed

# 1. IMPORTANTE: Arregla el problema de MIME types en Windows (CSS/JS no cargan)
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")

# 2. Crear las tablas en la base de datos y cargar los datos iniciales (seed)
Base.metadata.create_all(engine)
seed()

app = FastAPI(title="Moto Altiplano API", version="1.0.0")

# 3. Middleware CORS (permite peticiones desde el mismo servidor)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Incluir las rutas de la API (auth, motos, pedidos, admin)
for r in (auth, motos, pedidos, admin):
    app.include_router(r.router)

@app.get("/api/health", tags=["sistema"])
def health():
    return {"ok": True}

# 5. IMPORTANTE: Montar la carpeta frontend.
# El parámetro html=True es la clave: le dice a FastAPI que si alguien entra a "/",
# busque automáticamente el archivo "index.html" y lo muestre.
app.mount("/", StaticFiles(directory=Path(__file__).resolve().parent.parent / "frontend", html=True), name="web")