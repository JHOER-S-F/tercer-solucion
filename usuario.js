// Selecciona el contenedor donde se mostrarán los usuarios
const userList = document.getElementById('userList');

// Función para obtener y mostrar todos los usuarios
function fetchUsers() {
    fetch('/api/users')
        .then(response => response.json())
        .then(users => {
            // Limpia la lista antes de llenarla con los datos actualizados
            userList.innerHTML = '';
            users.forEach(user => {
                // Crea un elemento de lista para cada usuario
                const li = document.createElement('li');
                li.className = 'user-item';
                li.innerHTML = `
                    ${user.name} - ${user.email} - ${user.age} años
                    <button onclick="deleteUser(${user.id})">Eliminar</button>
                    <button onclick="promptUpdateUser(${user.id}, '${user.name}', '${user.email}', ${user.age})">Actualizar</button>
                `;
                userList.appendChild(li);
            });
        })
        .catch(error => console.error('Error al obtener los usuarios:', error));
}

// Función para añadir un nuevo usuario
function addUser() {
    // Obtiene los valores de los campos de entrada
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const age = document.getElementById('age').value;

    // Realiza una solicitud POST para añadir un nuevo usuario
    fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, age })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al añadir el usuario');
        return response.json();
    })
    .then(() => {
        // Actualiza la lista de usuarios y limpia el formulario
        fetchUsers();
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('age').value = '';
    })
    .catch(error => console.error('Error al añadir el usuario:', error));
}

// Función para eliminar un usuario
function deleteUser(id) {
    // Realiza una solicitud DELETE para eliminar el usuario
    fetch(`/api/users/${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error('Error al eliminar el usuario');
            fetchUsers(); // Actualiza la lista de usuarios
        })
        .catch(error => console.error('Error al eliminar el usuario:', error));
}

// Función para mostrar un formulario de actualización con los datos actuales del usuario
function promptUpdateUser(id, currentName, currentEmail, currentAge) {
    // Pide al usuario los nuevos datos
    const name = prompt("Nombre:", currentName);
    const email = prompt("Correo:", currentEmail);
    const age = prompt("Edad:", currentAge);

    // Si no se cancela, se procede a actualizar el usuario
    if (name && email && age) {
        updateUser(id, name, email, age);
    }
}

// Función para actualizar un usuario existente
function updateUser(id, name, email, age) {
    // Realiza una solicitud PUT para actualizar los datos del usuario
    fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, age })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al actualizar el usuario');
        fetchUsers(); // Actualiza la lista de usuarios
    })
    .catch(error => console.error('Error al actualizar el usuario:', error));
}

// Carga los usuarios cuando se cargue el contenido del documento
document.addEventListener('DOMContentLoaded', fetchUsers);
