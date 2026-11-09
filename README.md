# Moto Altiplano

Catálogo de motos con tres paneles (administrativo, trabajador y cliente) y API en Python (FastAPI).

## Estructura

```
proyecto_final/
├── backend/            API en Python
│   ├── main.py         arranque y archivos estáticos
│   ├── config.py       variables de entorno
│   ├── database.py     conexión SQLAlchemy
│   ├── models.py       usuarios, motos, pedidos
│   ├── schemas.py      validación de datos
│   ├── security.py     contraseñas, JWT y roles
│   ├── seed.py         datos iniciales
│   └── routers/        auth, motos, pedidos, admin
├── frontend/
│   ├── index.html      catálogo público (tu index.html actual)
│   ├── login.html      ingreso y registro de clientes
│   ├── admin/          panel administrativo
│   ├── trabajador/     panel de trabajador
│   ├── cliente/        panel de cliente
│   └── assets/         css y js compartidos
├── docs/
├── requirements.txt
└── .env.example
```

## Puesta en marcha

```bash
python -m venv .venv
.venv\Scripts\activate          # Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # y cambia SECRET_KEY
uvicorn backend.main:app --reload
```

- Sitio: http://127.0.0.1:8000 · Ingreso: /login.html · Documentación de la API: /docs

## Usuarios de prueba (cámbialos antes de publicar)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@motoaltiplano.pe | Admin12345 |
| Trabajador | trabajador@motoaltiplano.pe | Trabajo12345 |
| Cliente | cliente@motoaltiplano.pe | Cliente12345 |

## Permisos

- **Administrador:** resumen, motos (alta/baja), pedidos, usuarios.
- **Trabajador:** cambia el estado de pedidos y el stock. Al marcar «Entregado» se descuenta una unidad.
- **Cliente:** ve motos disponibles, solicita una y sigue sus pedidos.
