# 🏍️ Moto Altiplano - Plataforma E-commerce y Dashboard

Sistema web integral para la venta y gestión de motocicletas. El proyecto está dividido en una Landing Page pública de alto impacto, un catálogo interactivo para clientes, un panel logístico para trabajadores y un completo Dashboard administrativo con estadísticas y reportes.

Desarrollado con **Python (FastAPI)** en el backend y **HTML, CSS y JavaScript puro (Vanilla)** en el frontend, sin depender de frameworks pesados.

---

## ▶️ Cómo ejecutarlo

```bash
pip install -r requirements.txt
cp .env.example .env          # opcional: define tu SECRET_KEY
python -m uvicorn backend.main:app --reload
# abre http://localhost:8000
```

El frontend detecta solo si el backend está disponible (`/api/health`). Si no lo está
(por ejemplo en Firebase Hosting o abriendo los HTML sin servidor), funciona en **modo local**:
los datos se guardan en el navegador (`localStorage`) con las mismas cuentas de prueba.

---

## 🔐 Cuentas de Acceso y Roles

El sistema cuenta con 3 roles definidos. Las cuentas de prueba se generan automáticamente al iniciar el servidor por primera vez (archivo `seed.py`).

| Rol | Correo Electrónico | Contraseña | Permisos Principales |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@motoaltiplano.pe` | `Admin12345` | Dashboard con gráficos, CRUD de inventario, gestión de usuarios, exportación a Excel. |
| **Trabajador** | `trabajador@motoaltiplano.pe` | `Trabajo12345` | Ver pedidos, actualizar estados de envío y modificar stock. |
| **Cliente** | `cliente@motoaltiplano.pe` | `Cliente12345` | Explorar catálogo, ver fichas técnicas, guardar favoritos y solicitar motos. |

---

## ✨ Características Principales

### 🌐 Landing Page (Público General)
- **Diseño Premium:** Interfaz moderna con animaciones de scroll (Intersection Observer) y efectos visuales.
- **Buscador Global:** Permite buscar por marca o modelo y redirige al catálogo filtrado.
- **Secciones Interactivas:** Carrusel de modelos destacados, categorías visuales y sección de simulación de financiamiento.

### 🛒 Panel de Cliente
- **Catálogo Interactivo:** Filtros por tipo de moto, ordenamiento por precio/año y buscador en tiempo real.
- **Ficha Técnica del Producto:** Vista detallada de la moto con especificaciones técnicas generadas dinámicamente (Potencia, Torque, Rendimiento).
- **Lista de Deseos (Favoritos):** Guarda motos de interés usando `localStorage` (persistencia en el navegador).
- **Historial de Pedidos:** Seguimiento en tiempo real del estado de las solicitudes.

### 📊 Panel de Administrador
- **Dashboard Estadístico:** Integración con **Chart.js** para visualizar gráficos de dona (pedidos) y barras (usuarios).
- **Gestión Completa:** Creación y baja de motos (con soporte para URLs de imágenes), y gestión de usuarios del sistema.
- **Exportación a Excel:** Generación de archivos `.csv` (compatibles con Excel y acentos) para Pedidos, Inventario y Usuarios.

### 🔧 Panel de Trabajador
- **Gestión de Pedidos:** Actualización del estado (Pendiente ➔ En Proceso ➔ Entregado). Al marcarlo como "Entregado", el stock se descuenta automáticamente.
- **Control de Inventario:** Ajuste rápido del stock disponible de cada moto.

---

## 🛠️ Tecnologías Utilizadas

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web de alto rendimiento.
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM para base de datos.
- [SQLite](https://www.sqlite.org/) - Base de datos relacional (fácil de migrar a PostgreSQL).
- [PyJWT](https://pyjwt.readthedocs.io/) - Autenticación mediante Tokens JWT.
- [Pydantic](https://docs.pydantic.dev/) - Validación estricta de datos.

**Frontend:**
- HTML5, CSS3 (Variables, Flexbox, Grid, Glassmorphism).
- JavaScript (Vanilla) - Lógica del lado del cliente y manejo de rutas (SPA).
- [Chart.js](https://www.chartjs.org/) - Para los gráficos del Dashboard.
- [Google Fonts](https://fonts.google.com/) - Tipografía Montserrat.

---

## 📂 Estructura del Proyecto

```text
proyecto_final/
│
├── backend/                  # Servidor (FastAPI)
│   ├── main.py               # Arranque, CORS y archivos estáticos
│   ├── config.py             # Variables de entorno
│   ├── database.py           # Conexión SQLAlchemy
│   ├── models.py             # Tablas (Usuario, Moto, Pedido)
│   ├── schemas.py            # Validación de datos
│   ├── security.py           # Encriptación y JWT
│   ├── seed.py               # Datos iniciales
│   └── routers/              # Endpoints de la API (admin, auth, motos, pedidos)
│
├── frontend/                 # Interfaz de Usuario
│   ├── index.html            # Landing Page (Pública)
│   ├── login.html            # Login Premium (Split-Screen)
│   ├── admin/index.html      # Contenedor del Dashboard
│   ├── trabajador/index.html # Contenedor del Panel Trabajador
│   ├── cliente/index.html    # Contenedor del Catálogo
│   └── assets/
│       ├── css/
│       │   ├── landing.css   # Estilos de la Landing Page
│       │   └── panel.css     # Estilos globales (Login, Paneles, Catálogo)
│       └── js/
│           ├── core.js       # Lógica central (API, sesión, utilidades)
│           ├── admin.js      # Lógica del Dashboard y gráficos
│           ├── trabajador.js # Lógica del Panel Trabajador
│           └── cliente.js    # Lógica del Catálogo y Ficha Técnica
│
├── .env                      # Variables de entorno
├── requirements.txt          # Dependencias de Python
└── moto_altiplano.db         # Base de datos SQLite (Autogenerada)