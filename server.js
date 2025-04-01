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
const bcrypt = require('bcrypt');

// Middleware (aplicar en este orden)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
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
        encrypt: false,
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
////////////////////////////////////////////////////////////////////////
//MODULO 6GENERAL
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
////////////////////////////////////////////////////////////////////////
//modulo 7Users
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
// REGISTRAR TRABAJADORES EN EL MODULO 7users
app.post("/working-users", async (req, res) => {
  const { fullName, email, password, userRole, userStatus } = req.body;

  // Validación para asegurar que todos los campos sean proporcionados
  if (!fullName || !email || !password || !userRole || !userStatus) {
      return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
  }

  let pool;
  try {
      pool = await sql.connect(dbConfig);
      
      // Verificar si el email ya existe
      const checkEmail = await pool.request()
          .input("Email", sql.NVarChar, email)
          .query("SELECT Id FROM WorkingUsers WHERE Email = @Email");
          
      if (checkEmail.recordset.length > 0) {
          return res.status(400).json({ success: false, message: "El correo electrónico ya está registrado." });
      }

      // Hashear la contraseña antes de guardarla
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await pool.request()
          .input("fullName", sql.NVarChar, fullName)
          .input("email", sql.NVarChar, email)
          .input("password", sql.NVarChar, hashedPassword)
          .input("userRole", sql.NVarChar, userRole)
          .input("userStatus", sql.NVarChar, userStatus)
          .query(`
              INSERT INTO WorkingUsers (FullName, Email, Password, UserRole, UserStatus) 
              VALUES (@fullName, @email, @password, @userRole, @userStatus);
              SELECT SCOPE_IDENTITY() AS Id;
          `);

      // Respuesta de éxito al cliente
      res.json({ 
          success: true, 
          message: "Usuario agregado exitosamente.",
          userId: result.recordset[0].Id
      });
  } catch (err) {
      console.error("❌ Error al registrar usuario:", err);
      res.status(500).json({ success: false, message: "Error al registrar usuario." });
  } finally {
      if (pool) await pool.close();
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

  let pool;
  try {
    pool = await sql.connect(dbConfig);
    
    // Verificar si el email ya existe para otro usuario
    const checkEmail = await pool.request()
        .input("email", sql.NVarChar, email)
        .input("id", sql.Int, userId)
        .query("SELECT Id FROM WorkingUsers WHERE Email = @email AND Id != @id");
        
    if (checkEmail.recordset.length > 0) {
        return res.status(400).json({ success: false, message: "El correo electrónico ya está en uso por otro usuario." });
    }
    
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
    if (pool) await pool.close();
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
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// Asegúrate de tener esta importación al inicio del archivo

// GET - Obtener todos los usuarios con sus notas
app.get('/users', async (req, res) => {
    try {
      // Obtenemos usuarios con JOIN a la tabla de notas
      const result = await sql.query(`
        SELECT u.ID, u.FullName, u.Email, u.PhoneNumber, 
               n.NoteID, n.Note, n.CreatedAt 
        FROM Users u
        LEFT JOIN UserNotes n ON u.ID = n.UserID
        ORDER BY u.ID, n.CreatedAt DESC
      `);
      
      // Procesamos el resultado para agrupar las notas por usuario
      const usersMap = new Map();
      
      result.recordset.forEach(row => {
        if (!usersMap.has(row.ID)) {
          // Creamos el objeto usuario
          usersMap.set(row.ID, {
            ID: row.ID,
            FullName: row.FullName,
            Email: row.Email,
            PhoneNumber: row.PhoneNumber,
            notes: []
          });
        }
        
        // Si tiene nota, la agregamos al array de notas
        if (row.NoteID) {
          usersMap.get(row.ID).notes.push({
            NoteID: row.NoteID,
            Note: row.Note,
            CreatedAt: row.CreatedAt
          });
        }
      });
      
      // Convertimos el Map a un array para la respuesta
      const users = Array.from(usersMap.values());
      res.json(users);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      res.status(500).json({ message: 'Error al obtener los usuarios', error: err.message });
    }
  });
  
  // GET - Obtener un usuario por ID con sus notas
  app.get('/users/:id', async (req, res) => {
    try {
      // Obtenemos el usuario
      const userRequest = new sql.Request();
      const userResult = await userRequest
        .input('id', sql.Int, req.params.id)
        .query('SELECT ID, FullName, Email, PhoneNumber FROM Users WHERE ID = @id');
      
      if (userResult.recordset.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      const user = userResult.recordset[0];
      
      // Obtenemos las notas del usuario
      const notesRequest = new sql.Request();
      const notesResult = await notesRequest
        .input('userId', sql.Int, req.params.id)
        .query('SELECT NoteID, Note, CreatedAt FROM UserNotes WHERE UserID = @userId ORDER BY CreatedAt DESC');
      
      // Agregamos las notas al objeto usuario
      user.notes = notesResult.recordset;
      
      res.json(user);
    } catch (err) {
      console.error('Error al obtener usuario:', err);
      res.status(500).json({ message: 'Error al obtener el usuario', error: err.message });
    }
  });
  
  // POST - Crear un nuevo usuario
  app.post('/users', async (req, res) => {
    try {
      const { fullName, email, phoneNumber, password, note } = req.body;
      
      // Validaciones básicas
      if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
      }
      
      // Hashear la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Verificar si el email ya existe
      const checkRequest = new sql.Request();
      const checkEmail = await checkRequest
        .input('email', sql.NVarChar, email)
        .query('SELECT COUNT(*) as count FROM Users WHERE Email = @email');
      
      if (checkEmail.recordset[0].count > 0) {
        return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
      }
      
      // Iniciar transacción
      const transaction = new sql.Transaction();
      await transaction.begin();
      
      try {
        // Insertar el nuevo usuario
        const insertRequest = new sql.Request(transaction);
        const result = await insertRequest
          .input('fullName', sql.NVarChar, fullName)
          .input('email', sql.NVarChar, email)
          .input('phoneNumber', sql.NVarChar, phoneNumber || null)
          .input('password', sql.NVarChar, hashedPassword)
          .query(`
            INSERT INTO Users (FullName, Email, PhoneNumber, Password)
            OUTPUT INSERTED.ID
            VALUES (@fullName, @email, @phoneNumber, @password)
          `);
        
        const userId = result.recordset[0].ID;
        
        // Si hay nota, insertarla en la tabla UserNotes
        if (note) {
          const noteRequest = new sql.Request(transaction);
          await noteRequest
            .input('userId', sql.Int, userId)
            .input('note', sql.NVarChar, note)
            .query(`
              INSERT INTO UserNotes (UserID, Note)
              VALUES (@userId, @note)
            `);
        }
        
        // Commit de la transacción
        await transaction.commit();
        
        res.status(201).json({ 
          message: 'Usuario creado exitosamente',
          ID: userId
        });
      } catch (err) {
        // Rollback en caso de error
        await transaction.rollback();
        throw err;
      }
    } catch (err) {
      console.error('Error al crear usuario:', err);
      res.status(500).json({ message: 'Error al crear el usuario', error: err.message });
    }
  });
  
  // PUT - Actualizar un usuario existente
  app.put('/users/:id', async (req, res) => {
    try {
      const { fullName, email, phoneNumber, password, note } = req.body;
      const userId = req.params.id;
      
      // Validaciones básicas
      if (!fullName && !email && !phoneNumber && !note && !password) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar' });
      }
      
      // Verificar si el usuario existe
      const checkRequest = new sql.Request();
      const checkUser = await checkRequest
        .input('id', sql.Int, userId)
        .query('SELECT COUNT(*) as count FROM Users WHERE ID = @id');
      
      if (checkUser.recordset[0].count === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Si se va a actualizar el email, verificar que no exista para otro usuario
      if (email) {
        const emailRequest = new sql.Request();
        const checkEmail = await emailRequest
          .input('email', sql.NVarChar, email)
          .input('id', sql.Int, userId)
          .query('SELECT COUNT(*) as count FROM Users WHERE Email = @email AND ID != @id');
        
        if (checkEmail.recordset[0].count > 0) {
          return res.status(400).json({ message: 'El correo electrónico ya está registrado por otro usuario' });
        }
      }
      
      // Iniciar transacción
      const transaction = new sql.Transaction();
      await transaction.begin();
      
      try {
        // Construir la consulta dinámica de actualización para Usuario
        if (fullName || email || phoneNumber || password) {
          let updateQuery = 'UPDATE Users SET ';
          const queryParams = [];
          
          if (fullName) {
            queryParams.push('FullName = @fullName');
          }
          
          if (email) {
            queryParams.push('Email = @email');
          }
          
          if (phoneNumber !== undefined) {
            queryParams.push('PhoneNumber = @phoneNumber');
          }
          
          // Procesamos la contraseña por separado debido al hash
          let hashedPassword = null;
          if (password) {
            const saltRounds = 10;
            hashedPassword = await bcrypt.hash(password, saltRounds);
            queryParams.push('Password = @password');
          }
          
          updateQuery += queryParams.join(', ');
          updateQuery += ' WHERE ID = @id';
          
          // Ejecutar la actualización del usuario
          const updateRequest = new sql.Request(transaction);
          updateRequest.input('id', sql.Int, userId);
            
          if (fullName) updateRequest.input('fullName', sql.NVarChar, fullName);
          if (email) updateRequest.input('email', sql.NVarChar, email);
          if (phoneNumber !== undefined) updateRequest.input('phoneNumber', sql.NVarChar, phoneNumber);
          if (hashedPassword) updateRequest.input('password', sql.NVarChar, hashedPassword);
          
          await updateRequest.query(updateQuery);
        }
        
        // Si hay nota, gestionarla
        if (note !== undefined) {
          // Verificar si el usuario ya tiene notas
          const notesCheckRequest = new sql.Request(transaction);
          const notesResult = await notesCheckRequest
            .input('userId', sql.Int, userId)
            .query('SELECT TOP 1 NoteID FROM UserNotes WHERE UserID = @userId ORDER BY CreatedAt DESC');
          
          if (notesResult.recordset.length > 0 && note) {
            // Actualizar la nota existente más reciente
            const noteId = notesResult.recordset[0].NoteID;
            const updateNoteRequest = new sql.Request(transaction);
            await updateNoteRequest
              .input('noteId', sql.Int, noteId)
              .input('note', sql.NVarChar, note)
              .query('UPDATE UserNotes SET Note = @note WHERE NoteID = @noteId');
          } else if (note) {
            // Crear una nueva nota
            const insertNoteRequest = new sql.Request(transaction);
            await insertNoteRequest
              .input('userId', sql.Int, userId)
              .input('note', sql.NVarChar, note)
              .query('INSERT INTO UserNotes (UserID, Note) VALUES (@userId, @note)');
          }
        }
        
        // Commit de la transacción
        await transaction.commit();
        
        res.json({ message: 'Usuario actualizado exitosamente' });
      } catch (err) {
        // Rollback en caso de error
        await transaction.rollback();
        throw err;
      }
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      res.status(500).json({ message: 'Error al actualizar el usuario', error: err.message });
    }
  });
  
  // DELETE - Eliminar un usuario
  app.delete('/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Verificar si el usuario existe
      const checkRequest = new sql.Request();
      const checkUser = await checkRequest
        .input('id', sql.Int, userId)
        .query('SELECT COUNT(*) as count FROM Users WHERE ID = @id');
      
      if (checkUser.recordset[0].count === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Eliminar el usuario (las notas se eliminarán en cascada por la restricción ON DELETE CASCADE)
      const deleteRequest = new sql.Request();
      await deleteRequest
        .input('id', sql.Int, userId)
        .query('DELETE FROM Users WHERE ID = @id');
      
      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      res.status(500).json({ message: 'Error al eliminar el usuario', error: err.message });
    }
  });
  
  // GET - Obtener todas las notas de un usuario
  app.get('/userNotes/user/:userId', async (req, res) => {
    try {
      const request = new sql.Request();
      const result = await request
        .input('userId', sql.Int, req.params.userId)
        .query('SELECT NoteID, Note, CreatedAt FROM UserNotes WHERE UserID = @userId ORDER BY CreatedAt DESC');
      
      res.json(result.recordset);
    } catch (err) {
      console.error('Error al obtener notas del usuario:', err);
      res.status(500).json({ message: 'Error al obtener las notas', error: err.message });
    }
  });
  
  // POST - Crear una nueva nota para un usuario
  app.post('/userNotes', async (req, res) => {
    try {
      const { UserID, Note } = req.body;
      
      if (!UserID || !Note) {
        return res.status(400).json({ message: 'ID de usuario y contenido de la nota son obligatorios' });
      }
      
      // Verificar que el usuario exista
      const checkRequest = new sql.Request();
      const checkUser = await checkRequest
        .input('id', sql.Int, UserID)
        .query('SELECT COUNT(*) as count FROM Users WHERE ID = @id');
      
      if (checkUser.recordset[0].count === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Insertar la nueva nota
      const insertRequest = new sql.Request();
      const result = await insertRequest
        .input('userId', sql.Int, UserID)
        .input('note', sql.NVarChar, Note)
        .query(`
          INSERT INTO UserNotes (UserID, Note)
          OUTPUT INSERTED.NoteID
          VALUES (@userId, @note)
        `);
      
      res.status(201).json({ 
        message: 'Nota creada exitosamente',
        noteId: result.recordset[0].NoteID
      });
    } catch (err) {
      console.error('Error al crear nota:', err);
      res.status(500).json({ message: 'Error al crear la nota', error: err.message });
    }
  });
  
  // PUT - Actualizar una nota existente
  app.put('/userNotes/:noteId', async (req, res) => {
    try {
      const { Note } = req.body;
      const noteId = req.params.noteId;
      
      if (!Note) {
        return res.status(400).json({ message: 'El contenido de la nota es obligatorio' });
      }
      
      // Verificar que la nota exista
      const checkRequest = new sql.Request();
      const checkNote = await checkRequest
        .input('noteId', sql.Int, noteId)
        .query('SELECT COUNT(*) as count FROM UserNotes WHERE NoteID = @noteId');
      
      if (checkNote.recordset[0].count === 0) {
        return res.status(404).json({ message: 'Nota no encontrada' });
      }
      
      // Actualizar la nota
      const updateRequest = new sql.Request();
      await updateRequest
        .input('noteId', sql.Int, noteId)
        .input('note', sql.NVarChar, Note)
        .query('UPDATE UserNotes SET Note = @note WHERE NoteID = @noteId');
      
      res.json({ message: 'Nota actualizada exitosamente' });
    } catch (err) {
      console.error('Error al actualizar nota:', err);
      res.status(500).json({ message: 'Error al actualizar la nota', error: err.message });
    }
  });
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////





// Iniciar servidor
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
