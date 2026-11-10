# 🏍️ Moto Altiplano - Plataforma de E-commerce y Gestión

Sistema web completo diseñado para la venta, gestión y administración de motocicletas. El proyecto cuenta con una Landing Page pública, un panel de cliente para compras, un panel de trabajador para logística y un dashboard administrativo con estadísticas y reportes.

Desarrollado con **Python (FastAPI)** en el backend y **HTML, CSS y JavaScript puro (Vanilla)** en el frontend.

---

## 🔐 Cuentas de Acceso y Roles del Sistema

El sistema cuenta con **3 roles principales** con diferentes niveles de acceso. Las cuentas iniciales se crean automáticamente al arrancar el servidor por primera vez (mediante el archivo `seed.py`).

### 1. 👤 Administrador (Acceso Total)
Gestiona el inventario, los usuarios y visualiza las estadísticas del negocio.
- **Correo:** `admin@motoaltiplano.pe`
- **Contraseña:** `Admin12345`
- **Permisos:**
  - Ver Dashboard con gráficos estadísticos (Chart.js).
  - Crear, editar y dar de baja motos (Inventario).
  - Registrar nuevos usuarios (Admins, Trabajadores, Clientes).
  - Exportar reportes a Excel/CSV (Pedidos, Inventario y Usuarios).

### 2. 🔧 Trabajador (Gestión Logística)
Encargado del despacho y control del stock físico.
- **Correo:** `trabajador@motoaltiplano.pe`
- **Contraseña:** `Trabajo12345`
- **Permisos:**
  - Ver el panel de resumen de pedidos pendientes.
  - Cambiar el estado de los pedidos (Pendiente ➔ En Proceso ➔ Entregado).
  - Actualizar el stock de las motos manualmente.
  - *(Nota: Al marcar un pedido como "Entregado", el sistema descuenta automáticamente 1 unidad del stock).*

### 3. 🛒 Cliente (Comprador)
Usuario final que explora el catálogo y realiza solicitudes de compra.
- **Correo:** `cliente@motoaltiplano.pe`
- **Contraseña:** `Cliente12345`
- **Permisos:**
  - Explorar catálogo con filtros por tipo, buscador y ordenamiento.
  - Ver la ficha técnica detallada de cada moto.
  - Guardar motos en "Mis Favoritos" (se guarda en el navegador).
  - Solicitar una moto y hacer seguimiento a sus pedidos.
  - *(Los clientes nuevos también pueden registrarse desde el Login).*

---

## 🌟 Características Principales por Módulo

### 🌐 Landing Page (Público)
- Diseño moderno (Dark Mode) con animaciones de scroll (Intersection Observer).
- Buscador principal que redirige al catálogo con el filtro aplicado.
- Sección de categorías (Scooter, Naked, Deportiva, etc.).
- Carrusel de motos destacadas cargado desde la API.
- Sección de financiamiento con tarjeta de simulación animada.

### 🛒 Panel de Cliente
- **Catálogo Interactivo:** Filtros dinámicos y ordenamiento por precio.
- **Ficha Técnica (Modal):** Muestra especificaciones detalladas (Potencia, Torque, Rendimiento) generadas dinámicamente.
- **Lista de Deseos:** Botón de corazón para guardar favoritos localmente.
- **Mis Pedidos:** Tabla con el estado en tiempo real de sus solicitudes.

### 📊 Panel de Administrador
- **Dashboard Interactivo:** Gráficos de dona y barras para visualizar pedidos y usuarios.
- **Alertas de Stock:** Tarjetas visuales con motos que tienen 3 o menos unidades.
- **Módulo de Exportación:** Generación de archivos `.csv` con codificación UTF-8 (compatible con Excel y acentos).
- **Manejo de Imágenes:** Los administradores pueden asignar una URL de imagen a cada moto.

### 🔧 Panel de Trabajador
- Tabla de pedidos con selectores de estado en línea.
- Módulo de inventario rápido para ajustar stock.

---

## 🛠️ Tecnologías Utilizadas

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, PyJWT (Autenticación), Pydantic (Validación).
- **Base de Datos:** SQLite (por defecto, fácil de migrar a PostgreSQL).
- **Frontend:** HTML5, CSS3 (Variables, Flexbox, Grid), JavaScript ES6+.
- **Librerías Frontend:** Chart.js (Gráficos), Google Fonts (Montserrat).

---

## 🚀 Instalación y Despliegue Local

> **⚠️ Requisito:** Se recomienda usar **Python 3.10, 3.11 o 3.12**. Evita Python 3.13 o 3.15 ya que algunas librerías (como Pydantic) pueden fallar al compilar.

### Paso 1: Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd proyecto_final