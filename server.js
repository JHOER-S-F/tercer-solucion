require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const util = require('util');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.use(compression());
}

app.use(cors());
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true }
});

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

const query = util.promisify(connection.query).bind(connection);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const validarReserva = [
    body('fecha_entrada').isDate().withMessage('Fecha de entrada no válida'),
    body('hora_entrada').matches(/^\d{2}:\d{2}$/).withMessage('Hora de entrada no válida'),
    body('hora_salida').matches(/^\d{2}:\d{2}$/).withMessage('Hora de salida no válida'),
    body('cancha').isInt({ min: 1 }).withMessage('Selecciona una cancha válida')
];

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

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
