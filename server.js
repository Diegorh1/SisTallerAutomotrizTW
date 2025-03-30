require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express(); // Aquí definimos "app" correctamente
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

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
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
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

// Ruta para manejar el registro de usuarios INICIO DE SESION
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
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
// REGISTRAR TRABAJADORES EN EL MODULO 2
app.post("/working-users", async (req, res) => {
    const { fullName, email, userRole, userStatus } = req.body;

    // Validación para asegurar que todos los campos sean proporcionados
    if (!fullName || !email || !userRole || !userStatus) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input("fullName", sql.NVarChar, fullName)
            .input("email", sql.NVarChar, email) // Aquí se añadió la entrada para 'email'
            .input("userRole", sql.NVarChar, userRole)
            .input("userStatus", sql.NVarChar, userStatus)
            .query("INSERT INTO WorkingUsers (FullName, Email, UserRole, UserStatus) VALUES (@fullName, @email, @userRole, @userStatus)");

        // Respuesta de éxito al cliente
        res.json({ success: true, message: "Usuario que trabaja agregado exitosamente." });
    } catch (err) {
        console.error("❌ Error al registrar usuario que trabaja:", err);
        res.status(500).json({ success: false, message: "Error al registrar usuario que trabaja." });
    }
});

    //devolver los datos de la tabla working users
    app.get("/working-users", async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request().query("SELECT * FROM WorkingUsers");
            console.log("Usuarios obtenidos:", result.recordset); // Log de depuración
            if (result.recordset.length > 0) {
                res.json(result.recordset);
            } else {
                res.status(404).json({ success: false, message: "No se encontraron usuarios." });
            }
        } catch (err) {
            console.error("❌ Error al obtener usuarios:", err);
            res.status(500).json({ success: false, message: "Error en el servidor." });
        }
    });


    // PUT: Actualiza FullName, Email, UserRole y UserStatus de un usuario
app.put("/working-users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const { fullName, email, userRole, userStatus } = req.body;
  
    if (!userId || !fullName || !email || !userRole || !userStatus) {
      return res.status(400).json({ success: false, message: "Datos inválidos." });
    }
  
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input("id", sql.Int, userId)
        .input("fullName", sql.NVarChar, fullName)
        .input("email", sql.NVarChar, email)
        .input("userRole", sql.NVarChar, userRole)
        .input("userStatus", sql.NVarChar, userStatus)
        .query("UPDATE WorkingUsers SET FullName = @fullName, Email = @email, UserRole = @userRole, UserStatus = @userStatus WHERE Id = @id");
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado." });
      }
  
      res.json({ success: true, message: "Usuario actualizado exitosamente." });
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      res.status(500).json({ success: false, message: "Error al actualizar usuario." });
    } finally {
      sql.close();
    }
  });
  
  // DELETE: Elimina un usuario
  app.delete("/working-users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log("Intentando eliminar el usuario con ID:", userId);
  
    if (!userId) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }
  
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input("id", sql.Int, userId)
        .query("DELETE FROM WorkingUsers WHERE Id = @id");
      
      console.log("Filas afectadas:", result.rowsAffected[0]);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado." });
      }
  
      res.json({ success: true, message: "Usuario eliminado exitosamente." });
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      res.status(500).json({ success: false, message: "Error al eliminar usuario." });
    } finally {
      sql.close();
    }
  });

////////////////////////////////////////////////////////////////////////
// Endpoint para obtener clientes
// Iniciar servidor
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
