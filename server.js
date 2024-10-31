// Cargar variables de entorno en desarrollo
require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const util = require('util');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');      // Seguridad en producción
const compression = require('compression'); // Compresión de respuestas en producción

const app = express();
const port = process.env.PORT || 3000; // Utiliza el puerto desde .env o 3000 por defecto
const SECRET_KEY = process.env.SECRET_KEY; // Clave secreta para JWT desde .env

// Habilitar Helmet y compresión en producción
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(compression());
}

// Habilitar CORS (útil para desarrollo y producción)
app.use(cors());
app.use(bodyParser.json());

// Configurar la conexión a la base de datos usando variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true }// Asegura la conexión SSL en Azure
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL!');
    app.get('/', (req, res) => {
        res.send('JHOER SERRANO FORERO');
    });
});

// Promisificar la consulta de MySQL
const query = util.promisify(connection.query).bind(connection);

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Para manejar JSON

// Middleware de validación de entrada para las reservas
const validarReserva = [
    body('fecha_entrada').isDate().withMessage('Fecha de entrada no válida'),
    body('hora_entrada').matches(/^\d{2}:\d{2}$/).withMessage('Hora de entrada no válida'),
    body('hora_salida').matches(/^\d{2}:\d{2}$/).withMessage('Hora de salida no válida'),
    body('cancha').isInt({ min: 1 }).withMessage('Selecciona una cancha válida')
];

// Ruta para manejar las reservas
app.post('/reservar', validarReserva, async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    const { fecha_entrada, hora_entrada, hora_salida, cancha } = req.body;

    try {
        const checkQuery = `
            SELECT * FROM reservas 
            WHERE cancha = ? 
            AND fecha_entrada = ? 
            AND (
                (hora_entrada < ? AND hora_salida > ?) OR
                (hora_entrada >= ? AND hora_entrada < ?) OR
                (hora_salida > ? AND hora_salida <= ?)
            )
        `;
        const checkValues = [cancha, fecha_entrada, hora_salida, hora_entrada, hora_entrada, hora_salida, hora_entrada, hora_salida];

        const resultados = await query(checkQuery, checkValues);

        if (resultados.length > 0) {
            return res.status(400).json({ error: 'La cancha ya está reservada en el horario seleccionado.' });
        }

        const insertQuery = `
            INSERT INTO reservas (fecha_entrada, hora_entrada, hora_salida, cancha) 
            VALUES (?, ?, ?, ?)
        `;
        const insertValues = [fecha_entrada, hora_entrada, hora_salida, cancha];

        await query(insertQuery, insertValues);
        res.json({ message: 'Reserva realizada con éxito!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno al realizar la reserva' });
    }
});

// Ruta para registrar usuario
app.post('/register', async (req, res) => {
    const { nombre, correo, contraseña } = req.body;

    const checkSql = 'SELECT * FROM users WHERE correo = ?';
    connection.query(checkSql, [correo], (err, results) => {
        if (err) {
            console.error('Error al verificar el correo:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (results.length > 0) {
            return res.status(409).json({ message: 'Este correo ya está registrado' });
        }

        bcrypt.hash(contraseña, 10, (err, hash) => {
            if (err) {
                console.error('Error al hash de la contraseña:', err);
                return res.status(500).json({ error: 'Error al registrar el usuario' });
            }

            const sql = 'INSERT INTO users (nombre, correo, contraseña) VALUES (?, ?, ?)';
            connection.query(sql, [nombre, correo, hash], (err, result) => {
                if (err) {
                    console.error('Error al registrar el usuario:', err);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }
                res.status(201).json({ message: 'Usuario registrado con éxito' });
            });
        });
    });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { correo, contraseña } = req.body;
    const sql = 'SELECT * FROM users WHERE correo = ?';
    connection.query(sql, [correo], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(contraseña, user.contraseña, (err, isMatch) => {
                if (err) {
                    console.error('Error al comparar contraseñas:', err);
                    return res.status(500).json({ error: 'Error al iniciar sesión' });
                }

                if (isMatch) {
                    const token = jwt.sign({ id: user.id, correo: user.correo }, SECRET_KEY, { expiresIn: '1h' });
                    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
                } else {
                    res.status(401).json({ message: 'Credenciales incorrectas' });
                }
            });
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    });
});

// Middleware para verificar el token
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del encabezado

    if (!token) {
        return res.status(403).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }
        req.userId = decoded.id; 
        next();
    });
};

// Ruta para verificar si el usuario está registrado
app.get('/verificar', verificarToken, (req, res) => {
    res.status(200).json({ message: 'Usuario autenticado' });
});

// Middleware global para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal. Por favor, intenta más tarde.' });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
