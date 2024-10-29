document.getElementById('reservaForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevenir el envío predeterminado del formulario

    const horaEntrada = document.getElementById('hora_entrada').value;
    const horaSalida = document.getElementById('hora_salida').value;

    // Verificar que la hora de salida sea posterior a la hora de entrada
    if (horaSalida <= horaEntrada) {
        document.getElementById('resultado').innerText = 'La hora de salida debe ser posterior a la hora de entrada.';
        document.getElementById('resultado').style.color = 'red';
        return;
    }

    // Si la verificación es correcta, proceder a enviar los datos
    const formData = new FormData(this);  // Recoger los datos del formulario
    const data = new URLSearchParams(formData).toString();  // Convertir a x-www-form-urlencoded

    fetch(this.action, {
        method: 'POST',
        body: data,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
    .then(response => {
        if (!response.ok) {
            // Si la respuesta no es 200-299, lanzar un error
            return response.json().then(err => {
                throw new Error(err.error || 'Error en la reserva');
            });
        }
        return response.json(); // Cambiado a JSON
    })
    .then(result => {
        // Mostrar el resultado en el contenedor con id "resultado"
        const resultadoDiv = document.getElementById('resultado');
        resultadoDiv.innerText = result.message; // Mostrar el mensaje del servidor

        // Aplicar estilos según el éxito o error de la operación
        if (result.message.includes('éxito')) {
            resultadoDiv.style.color = 'green';
            this.reset();  // Limpiar el formulario si la reserva fue exitosa
        } else {
            resultadoDiv.style.color = 'red';
        }
    })
    .catch(error => {
        // Mostrar el error en el contenedor "resultado"
        const resultadoDiv = document.getElementById('resultado');
        resultadoDiv.innerText = 'Error en la reserva: ' + error.message;
        resultadoDiv.style.color = 'red';
    });
});
