// frontend/js/cliente.js

// 1. Función para obtener las motos del backend
async function obtenerMotos() {
    try {
        const respuesta = await fetch('http://localhost:8000/motos'); // Ajusta la URL a tu endpoint real
        const motos = await respuesta.json();
        renderizarCatalogo(motos);
    } catch (error) {
        console.error("Error al cargar las motos:", error);
    }
}

// 2. Función para crear las tarjetas HTML dinámicamente
function renderizarCatalogo(motos) {
    const contenedor = document.querySelector('.grid-catalogo'); // Asegúrate de que esta clase coincida con tu HTML
    contenedor.innerHTML = ''; // Limpiar el contenedor antes de agregar las nuevas

    motos.forEach(moto => {
        // Formatear el precio
        const precioFormateado = new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(moto.precio);

        // Crear el HTML de la tarjeta (basado en tu diseño de la Imagen 2)
        const tarjetaHTML = `
            <div class="card-moto">
                <div class="card-header">
                    <span class="badge badge-success">${moto.estado || 'DISPONIBLE'}</span>
                    <button class="btn-favorito"><i class="fa-regular fa-heart"></i></button>
                </div>
                <img src="${moto.imagen}" alt="${moto.modelo}" class="card-img">
                <div class="card-body">
                    <div class="card-info-top">
                        <span class="marca">${moto.marca}</span>
                        <span class="anio">${moto.anio}</span>
                    </div>
                    <h3 class="titulo-moto">${moto.modelo}</h3>
                    <p class="descripcion">${moto.descripcion || 'Potencia y estilo garantizado.'}</p>
                    
                    <div class="card-footer">
                        <div class="precio-box">
                            <span class="moneda">S/</span>
                            <span class="precio">${precioFormateado.replace('S/', '').trim()}</span>
                        </div>
                        <div class="botones">
                            <button class="btn-secundario">Ver Ficha</button>
                            <button class="btn-primario">Solicitar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
    });
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', obtenerMotos);