async function iniciarSesion(event) {
    event.preventDefault();
    
    const correo = document.getElementById('correoInicio').value;
    const contraseña = document.getElementById('contraseñaInicio').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ correo, contraseña })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            // Guardar el token en localStorage
            localStorage.setItem('token', data.token);
            // Redirigir a usuario.html después de un inicio de sesión exitoso
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al comunicarse con el servidor');
    }
};

async function registrarUsuario(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombreRegistro').value;
    const correo = document.getElementById('correoRegistro').value;
    const contraseña = document.getElementById('contraseñaRegistro').value;

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, correo, contraseña })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            // Puedes redirigir o limpiar el formulario aquí
        } else {
            alert(data.message || 'Error al registrarse');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al comunicarse con el servidor');
    }
};
