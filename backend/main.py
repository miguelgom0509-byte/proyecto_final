import mimetypes
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import admin, auth, motos, pedidos
from .seed import seed

# En Windows el registro puede devolver tipos MIME erróneos y el navegador bloquea el CSS/JS.
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")

Base.metadata.create_all(engine)
seed()

app = FastAPI(title="Moto Altiplano API", version="1.0.0")
for r in (auth, motos, pedidos, admin):
    app.include_router(r.router)


@app.get("/api/health", tags=["sistema"])
def health():
    return {"ok": True}


# El frontend se sirve desde el mismo servidor (después de las rutas /api).
app.mount("/", StaticFiles(directory=Path(__file__).resolve().parent.parent / "frontend", html=True), name="web")
