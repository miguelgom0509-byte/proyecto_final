# 🏍️ Moto Altiplano · Henvi del Sur — Plataforma de venta y gestión de motos

Sistema web para la venta y gestión de motocicletas: landing pública con ofertas, tienda para clientes, panel para trabajadores y panel administrativo con reportes.

Frontend en **HTML, CSS y JavaScript puro** (sin frameworks). Backend opcional en **Python (FastAPI)**. Publicado en **Firebase Hosting** con datos en **Cloud Firestore**: https://motos-henvi.web.app

---

## ▶️ Cómo ejecutarlo

### Con el backend FastAPI (SQLite)
```bash
pip install -r requirements.txt
cp .env.example .env          # opcional: define tu SECRET_KEY
python -m uvicorn backend.main:app --reload
# abre http://localhost:8000
```

### Solo el frontend (sin servidor propio)
```bash
cd frontend
python3 -m http.server 8000   # abre http://localhost:8000
```

### Modos de almacenamiento (se elige solo)
El frontend decide dónde guardar los datos, en este orden:

| Orden | Modo | Cuándo se usa | Dónde viven los datos |
| :-- | :-- | :-- | :-- |
| 1 | **Backend FastAPI** | Responde `/api/health` | SQLite (`moto_altiplano.db`) |
| 2 | **Cloud Firestore** | Sitio publicado en Firebase Hosting | Nube: se comparten entre máquinas |
| 3 | **Local** | localhost, archivo abierto a mano o Firestore no disponible | `localStorage` del navegador (cada navegador tiene su copia) |

---

## ☁️ Publicar en Firebase (Hosting + Firestore)

1. **Reglas de Firestore** (consola > Firestore > Reglas > Publicar), o con `firebase deploy --only firestore:rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{col}/{doc} {
         allow read, write: if col in ['motos', 'usuarios', 'pedidos', 'meta'];
       }
     }
   }
   ```
2. **Cargar los datos iniciales** (catálogo de 57 motos y cuentas demo). En Cloud Shell, con `firestore_henvi.json` e `importar_firestore.js` subidos:
   ```bash
   npm i firebase-admin
   node importar_firestore.js
   ```
   Si la base está vacía, el sitio también la siembra solo al primer ingreso.
3. **Subir el sitio:**
   ```bash
   firebase deploy --only hosting
   ```
   Recarga con Ctrl+F5 (los archivos html/css/js se sirven sin caché).

Colecciones de Firestore: `motos`, `usuarios`, `pedidos` (el id del documento es el id numérico).

> ⚠️ **Seguridad:** el sitio usa su propio login (sin Firebase Authentication), por lo que las reglas no pueden separar roles. Es adecuado para un proyecto académico o demo. Para uso real hay que migrar el login a Firebase Authentication y escribir reglas por rol.

---

## 🔐 Cuentas de acceso y roles

| Rol | Correo | Contraseña | Permisos principales |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@motoaltiplano.pe` | `Admin12345` | Dashboard, reportes, inventario, usuarios, exportaciones. |
| **Trabajador** | `trabajador@motoaltiplano.pe` | `Trabajo12345` | Pedidos, stock, precios y cotizador. |
| **Cliente** | `cliente@motoaltiplano.pe` | `Cliente12345` | Catálogo, fichas, favoritos y solicitud de motos. |

Ingreso con Google/Facebook (Firebase Authentication) disponible solo en el sitio publicado.

---

## ✨ Características

### 🌐 Landing (público)
- Diseño urbano de "franja de carrera": azul, amarillo vial, grano de concreto, cinta neón y botones con huella de llanta.
- Buscador por marca/modelo, carrusel de modelos destacados, comparador y galería.
- **Ofertas de la semana:** tres motos recomendadas elegidas con datos reales del catálogo (la más económica, ideal para trabajar y la más potente), con stock en vivo, botón "Pedir ahora" y WhatsApp con mensaje prellenado.
- Botón flotante de WhatsApp, sección de SOAT y preguntas frecuentes.
- **Animaciones** (`motion.js` / `motion.css`): entrada escalonada al hacer scroll, contadores, parallax, tilt de la moto, botones magnéticos, onda al pulsar, barra de progreso. Respeta "reducir movimiento".

### 🛒 Panel de cliente (tienda)
- Catálogo con filtros por marca y tipo, orden por precio/año y búsqueda en vivo.
- Ficha técnica por moto (`fichas.js`), favoritos y solicitud de pedido.
- Historial de pedidos con su estado.

### 📊 Panel de administrador
- **Resumen** con KPIs y gráficos (Chart.js).
- **Reportes:** período 7/30/90 días o todo, ventas y ticket promedio, pedidos por día/semana, top de motos, valor de inventario por marca, modelos por tipo.
- **Pedidos** con ventana de detalle y línea de tiempo (atender, entregar, cancelar, reabrir, copiar resumen).
- **Inventario** (alta/edición/baja de motos) y **usuarios**.
- **Búsqueda global (Ctrl K)** de secciones, motos, pedidos y usuarios, y **campana de avisos** (pedidos pendientes y stock bajo).
- **Exportación** de cada tabla e informe en **CSV** (para Excel en español, con acentos), **PDF** (con encabezado y numeración de páginas) y **JSON** (con metadatos del informe).

### 🔧 Panel de trabajador
- **Resumen** con cola de trabajo y motos por reponer.
- **Pedidos** con filtros, búsqueda, paginación y acción rápida. Al marcar "Entregado" el stock se descuenta solo.
- **Inventario** con ajuste +/− y registro de llegadas.
- **Precios** (lista, tarjeta y bono) y **Cotizador** con mensaje para el cliente (copiar o enviar por WhatsApp).
- Mismas herramientas globales: Ctrl K, campana y exportación CSV/PDF/JSON.

---

## 🛠️ Tecnologías

**Frontend:** HTML5, CSS3 (variables, Grid, Flexbox), JavaScript vanilla, [Chart.js](https://www.chartjs.org/), [AOS](https://michalsnik.github.io/aos/), [jsPDF](https://github.com/parallax/jsPDF) + [AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) (se cargan al exportar PDF; sin conexión se abre una vista imprimible), Firebase (Hosting, Firestore y Authentication para el ingreso social).

**Backend (opcional):** FastAPI, SQLAlchemy, SQLite, PyJWT, Pydantic.

---

## 📂 Estructura

```text
proyecto_final/
├── backend/                    # Servidor FastAPI (opcional)
│   ├── main.py  config.py  database.py  models.py  schemas.py  security.py  seed.py
│   └── routers/                # admin, auth, motos, pedidos
│
├── frontend/                   # Sitio (carpeta publicada en Firebase Hosting)
│   ├── index.html              # Landing pública
│   ├── login.html              # Ingreso y registro
│   ├── 404.html
│   ├── admin/index.html        # Panel administrador
│   ├── trabajador/index.html   # Panel trabajador
│   ├── cliente/index.html      # Tienda del cliente
│   ├── recursos/image/         # Fotos de motos y logos
│   └── assets/
│       ├── css/
│       │   ├── landing.css     # Landing (incluye Ofertas)
│       │   ├── urbano.css      # Estilo urbano compartido (login, tienda)
│       │   ├── shop.css        # Tienda del cliente
│       │   ├── panel.css       # Base de los paneles
│       │   ├── admin.css       # Componentes de admin y trabajador
│       │   └── motion.css      # Animaciones compartidas
│       └── js/
│           ├── core.js         # API (backend / Firestore / local), sesión, utilidades
│           ├── panelx.js       # Compartido admin+trabajador: exportar CSV/PDF/JSON, detalle de pedido, Ctrl K, avisos
│           ├── admin.js        # Panel administrador
│           ├── trabajador.js   # Panel trabajador
│           ├── cliente.js      # Tienda
│           ├── fichas.js       # Fichas técnicas
│           └── motion.js       # Animaciones compartidas
│
├── firebase.json  .firebaserc  # Hosting (carpeta public: frontend)
├── firestore.rules             # Reglas de Firestore (opcional, ver arriba)
├── requirements.txt  .env.example
└── docs/Moto_Altiplano_README.pdf
```

---

## 🩺 Solución de problemas

- **Panel en blanco tras publicar:** suele ser un `admin.js` con marcas de conflicto de merge (`<<<<<<<`). Reemplázalo por una copia limpia y vuelve a publicar. El panel muestra un aviso con el error y un botón "Reiniciar datos".
- **Los pedidos no aparecen en otra máquina:** en ese caso se estaba usando el modo local. Revisa que Firestore tenga las reglas publicadas y los datos cargados, y que abras el sitio publicado (no localhost).
- **Cambios que no se ven:** recarga con Ctrl+F5.