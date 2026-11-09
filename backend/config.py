import os
from dotenv import load_dotenv

# Carga las variables desde el archivo .env
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-cambia-esto-en-produccion")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./moto_altiplano.db")
TOKEN_MINUTES = int(os.getenv("TOKEN_MINUTES", "480"))

# Validación básica de seguridad
if SECRET_KEY == "dev-cambia-esto-en-produccion" and os.getenv("ENVIRONMENT") == "production":
    raise ValueError("¡Peligro! Debes configurar una SECRET_KEY segura en producción.")