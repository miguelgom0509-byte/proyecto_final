import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-cambia-esto-en-produccion")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./moto_altiplano.db")
TOKEN_MINUTES = int(os.getenv("TOKEN_MINUTES", "480"))
