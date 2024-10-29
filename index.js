// index.js

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem('token'); // Obtener el token del localStorage
  const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');
  const registrarBtn = document.querySelector('.sesion');
  const reservasLink = document.querySelector('a[href="REGISTRO/registro.html"]');
  const operacionalSection = document.getElementById('operacional'); // Selecciona la sección operacional

  // Mostrar u ocultar botones y secciones según el estado de autenticación
  if (token) {
      cerrarSesionBtn.style.display = 'block'; // Mostrar el botón de cerrar sesión
      if (registrarBtn) {
          registrarBtn.style.display = 'none'; // Ocultar el botón de registrarse
      }

      operacionalSection.style.display = 'block'; // Mostrar la sección operacional

      // Redirigir a reservas si el usuario no está registrado
      if (reservasLink) {
          reservasLink.addEventListener('click', (event) => {
              event.preventDefault();
              // Verificar si el usuario está registrado
              verificarRegistro(token).then(isRegistered => {
                  if (isRegistered) {
                      window.location.href = 'REGISTRO/registro.html';
                  } else {
                      alert('Debes registrarte antes de hacer una reserva.');
                  }
              });
          });
      }
  } else {
      cerrarSesionBtn.style.display = 'none'; // Ocultar el botón si no está autenticado
      operacionalSection.style.display = 'none'; // Asegurarse de que la sección operacional esté oculta
  }
});

// Función para verificar si el usuario está registrado
async function verificarRegistro(token) {
  try {
      const response = await fetch('http://localhost:3000/verificar', {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      return response.ok; // Devuelve true si la respuesta es 200
  } catch (error) {
      console.error('Error al verificar registro:', error);
      return false; // Retorna false si hay un error
  }
}

// Función para cerrar sesión
function cerrarSesion() {
  localStorage.removeItem('token'); // Eliminar el token del localStorage
  window.location.reload(); // Recargar la página
}
