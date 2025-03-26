require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de conexión a SQL Server
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false, // Cambiar a true si usas Azure
        trustServerCertificate: true
    }
};

// Función para conectar a SQL Server
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log("✅ Conectado a SQL Server");
    } catch (err) {
        console.error("❌ Error de conexión a SQL Server:", err);
    }
}

// Ruta para manejar el inicio de sesión
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, password)
            .query("SELECT * FROM Users WHERE Email = @email AND Password = @password");

        if (result.recordset.length > 0) {
            res.json({ success: true, message: "Login exitoso" });
        } else {
            res.json({ success: false, message: "Credenciales incorrectas" });
        }
    } catch (err) {
        console.error("❌ Error en login:", err);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

// Ruta para manejar el registro de usuarios
app.post("/register", async (req, res) => {
    const { fullName, email, phoneNumber, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input("fullName", sql.NVarChar, fullName)
            .input("email", sql.NVarChar, email)
            .input("phoneNumber", sql.NVarChar, phoneNumber)
            .input("password", sql.NVarChar, password)
            .query("INSERT INTO Users (FullName, Email, PhoneNumber, Password) VALUES (@fullName, @email, @phoneNumber, @password)");

        res.json({ success: true, message: "Registro exitoso" });
    } catch (err) {
        console.error("❌ Error en registro:", err);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

// Iniciar servidor
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
