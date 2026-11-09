import mimetypes
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import admin, auth, motos, pedidos
from .seed import seed

# 1. IMPORTANTE: Esto arregla el problema de los CSS/JS en Windows
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")

Base.metadata.create_all(engine)
seed()

app = FastAPI(title="Moto Altiplano API", version="1.0.0")

# 2. Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, motos, pedidos, admin):
    app.include_router(r.router)

@app.get("/api/health", tags=["sistema"])
def health():
    return {"ok": True}

# 3. IMPORTANTE: Montar la carpeta frontend
app.mount("/", StaticFiles(directory=Path(__file__).resolve().parent.parent / "frontend", html=True), name="web")