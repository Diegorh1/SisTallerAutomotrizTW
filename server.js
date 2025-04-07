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
// --- Pool de Conexiones ---
let pool;

// Middleware (aplicar en este orden)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(bodyParser.json());
  app.use(express.json());


// Configuración de conexión a SQL Server
// --- Configuración DB ---
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '1433'), // Puerto default SQL Server
  options: {
      // Asegúrate que estos valores sean booleanos o strings 'true'/'false' en tu .env
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
  }
};

// --- Función para conectar a SQL Server ---
async function connectDB() {
  try {
      console.log("🔧 Intentando conectar a la base de datos..."); // Log de inicio
      pool = await sql.connect(dbConfig); // Asigna la conexión a la variable 'pool'
      console.log("✅ Conectado a SQL Server");
  } catch (err) {
      console.error("❌ Error de conexión a SQL Server:", err.message); // Muestra el mensaje de error
      process.exit(1); // Detiene la aplicación si la conexión inicial falla
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
//MODULO DE CITAS
// --- Rutas de Citas (Appointments) ---

// GET Todas las citas (antes era /api/appointments/all, ahora la ruta principal)
// También puede manejar filtros opcionales
app.get('/api/appointments', async (req, res) => {
  const { date, client, status } = req.query; // Obtener filtros

  // Verifica si el pool está listo
  if (!pool) {
      console.error("Error: El pool de conexiones no está inicializado al recibir petición GET /api/appointments.");
      return res.status(500).json({ message: "Error interno del servidor: Conexión no lista." });
  }

  try {
      // 1. ***** MODIFICACIÓN: Añadir LEFT JOIN y columnas de ServiceFeedback *****
      let query = `
          SELECT
              A.AppointmentID, A.UserID, A.AppointmentDateTime, A.VehicleDescription,
              A.ServiceType, A.Status, A.Notes, A.CreatedAt, A.UpdatedAt,
              U.FullName AS ClientFullName,
              -- Columnas de ServiceFeedback (con alias para claridad)
              SF.FeedbackID, SF.Rating AS FeedbackRating, SF.Comments AS FeedbackComments, SF.SubmittedAt AS FeedbackSubmittedAt
          FROM Appointments A
          LEFT JOIN Users U ON A.UserID = U.ID
          LEFT JOIN ServiceFeedback SF ON A.AppointmentID = SF.AppointmentID -- <<-- UNIR CON FEEDBACK
          WHERE 1=1 -- Para facilitar añadir filtros
      `;
      const request = pool.request();
      const conditions = [];

      // Aplicar filtros (igual que antes)
      if (date) {
          conditions.push("CONVERT(date, A.AppointmentDateTime) = @FilterDate");
          request.input('FilterDate', sql.Date, date);
      }
      if (client) {
          conditions.push("(U.FullName LIKE @FilterClient OR U.Email LIKE @FilterClient)");
          request.input('FilterClient', sql.NVarChar, `%${client}%`);
      }
      if (status) {
          conditions.push("A.Status = @FilterStatus");
          request.input('FilterStatus', sql.NVarChar, status);
      }

      if (conditions.length > 0) {
          query += " AND " + conditions.join(" AND ");
      }
      query += " ORDER BY A.AppointmentDateTime DESC;";

      // 2. ***** MODIFICACIÓN: Usar async/await para la consulta *****
      const result = await request.query(query);

      // 3. ***** MODIFICACIÓN: Mapear resultados anidando User y Feedback *****
      const appointments = result.recordset.map(app => {
          // Crear el objeto base de la cita
          const appointmentBase = {
              AppointmentID: app.AppointmentID,
              UserID: app.UserID,
              AppointmentDateTime: app.AppointmentDateTime,
              VehicleDescription: app.VehicleDescription,
              ServiceType: app.ServiceType,
              Status: app.Status,
              Notes: app.Notes,
              CreatedAt: app.CreatedAt,
              UpdatedAt: app.UpdatedAt,
              User: { FullName: app.ClientFullName || null } // Asegurar que User siempre exista
          };

          // Añadir el objeto Feedback solo si se encontró un FeedbackID
          if (app.FeedbackID) {
              appointmentBase.Feedback = {
                  FeedbackID: app.FeedbackID,
                  Rating: app.FeedbackRating,
                  Comments: app.FeedbackComments,
                  SubmittedAt: app.FeedbackSubmittedAt
              };
          } else {
              appointmentBase.Feedback = null; // Indicar explícitamente que no hay feedback
          }
          return appointmentBase;
      });

      res.json(appointments); // Enviar la respuesta con la estructura modificada

  } catch (error) {
      console.error("Error en GET /api/appointments:", error.message);
      res.status(500).json({ message: "Error interno del servidor al obtener citas." });
  }
});



// POST Crear nueva cita (Admin - requiere identificar cliente)
app.post('/api/appointments', async (req, res) => { // Removido authenticateToken, isAdmin. Endpoint unificado.
  const { clientIdentifier, appointmentDateTime, vehicleDescription, serviceType, status, notes } = req.body;

  if (!clientIdentifier || !appointmentDateTime || !vehicleDescription || !serviceType || !status) {
      return res.status(400).json({ message: "Identificador de cliente, Fecha/Hora, Vehículo, Servicio y Estado son requeridos." });
  }

  try {
      // 1. Buscar el UserID del cliente
      const userRequest = pool.request();
      userRequest.input('ClientIdentifier', sql.NVarChar, clientIdentifier);
      const userQuery = "SELECT ID FROM Users WHERE Email = @ClientIdentifier OR FullName = @ClientIdentifier";

      userRequest.query(userQuery, (userErr, userResult) => {
          if (userErr) {
               console.error("Error buscando cliente:", userErr);
               return res.status(500).json({ message: "Error buscando cliente" });
          }
          if (userResult.recordset.length === 0) {
              return res.status(404).json({ message: "Cliente no encontrado con el identificador proporcionado." });
          }
          if (userResult.recordset.length > 1) {
               return res.status(409).json({ message: "Múltiples clientes encontrados. Use email preferentemente." });
          }

          const userId = userResult.recordset[0].ID;

           // 2. Crear la cita
          const appRequest = pool.request();
          appRequest.input('UserID', sql.Int, userId);
          appRequest.input('AppointmentDateTime', sql.DateTime2, new Date(appointmentDateTime));
          appRequest.input('VehicleDescription', sql.NVarChar, vehicleDescription);
          appRequest.input('ServiceType', sql.NVarChar, serviceType);
          appRequest.input('Status', sql.NVarChar, status);
          appRequest.input('Notes', sql.NVarChar, notes || null);

          const appQuery = `
              INSERT INTO Appointments (UserID, AppointmentDateTime, VehicleDescription, ServiceType, Status, Notes)
              OUTPUT INSERTED.*
              VALUES (@UserID, @AppointmentDateTime, @VehicleDescription, @ServiceType, @Status, @Notes);
          `;

           appRequest.query(appQuery, (appErr, appResult) => {
              if (appErr) {
                  console.error("Error creando cita:", appErr);
                  return res.status(500).json({ message: "Error interno al crear cita" });
              }
              // Añadir info del usuario a la respuesta para consistencia con GET
              const createdAppointment = { ...appResult.recordset[0], User: { FullName: clientIdentifier } }; // Asume el identificador es el nombre si no se tiene aquí
              res.status(201).json(createdAppointment);
          });
      });

  } catch (error) {
      console.error("Error en POST /api/appointments:", error);
      res.status(500).json({ message: "Error interno del servidor" });
  }
});

// PUT Actualizar cita por ID
app.put('/api/appointments/:id', async (req, res) => { // Removido authenticateToken y isAdmin
  const appointmentId = parseInt(req.params.id);
  const { appointmentDateTime, vehicleDescription, serviceType, status, notes } = req.body;

  if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "ID de cita inválido." });
  }
  if (!appointmentDateTime || !vehicleDescription || !serviceType || !status) {
       return res.status(400).json({ message: "Fecha/Hora, Vehículo, Servicio y Estado son requeridos." });
  }

  try {
      const request = pool.request();
      request.input('AppointmentID', sql.Int, appointmentId);
      request.input('AppointmentDateTime', sql.DateTime2, new Date(appointmentDateTime));
      request.input('VehicleDescription', sql.NVarChar, vehicleDescription);
      request.input('ServiceType', sql.NVarChar, serviceType);
      request.input('Status', sql.NVarChar, status);
      request.input('Notes', sql.NVarChar, notes || null);
      request.input('UpdatedAt', sql.DateTime2, new Date());

       const query = `
          UPDATE Appointments
          SET
              AppointmentDateTime = @AppointmentDateTime,
              VehicleDescription = @VehicleDescription,
              ServiceType = @ServiceType,
              Status = @Status,
              Notes = @Notes,
              UpdatedAt = @UpdatedAt
          OUTPUT INSERTED.*
          WHERE AppointmentID = @AppointmentID;
      `;

      request.query(query, (err, result) => {
          if (err) {
              console.error(`Error actualizando cita ${appointmentId}:`, err);
              return res.status(500).json({ message: "Error interno al actualizar cita" });
          }
          if (result.rowsAffected[0] === 0) {
              return res.status(404).json({ message: "Cita no encontrada." });
          }
           // Aquí no tenemos el nombre del usuario fácilmente, podríamos hacer otro query o devolver sin él
          res.json(result.recordset[0]);
      });

  } catch (error) {
      console.error(`Error en PUT /api/appointments/${appointmentId}:`, error);
      res.status(500).json({ message: "Error interno del servidor" });
  }
});

// DELETE Eliminar cita por ID
app.delete('/api/appointments/:id', async (req, res) => { // Removido authenticateToken y isAdmin
  const appointmentId = parseInt(req.params.id);

   if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "ID de cita inválido." });
  }

  try {
       const request = pool.request();
      request.input('AppointmentID', sql.Int, appointmentId);
      const query = "DELETE FROM Appointments WHERE AppointmentID = @AppointmentID;";

       request.query(query, (err, result) => {
          if (err) {
              console.error(`Error eliminando cita ${appointmentId}:`, err);
              return res.status(500).json({ message: "Error interno al eliminar cita" });
          }
           if (result.rowsAffected[0] === 0) {
              return res.status(404).json({ message: "Cita no encontrada." });
          }
          res.status(200).json({ message: `Cita ID ${appointmentId} eliminada.` });
      });

  } catch (error) {
      console.error(`Error en DELETE /api/appointments/${appointmentId}:`, error);
      res.status(500).json({ message: "Error interno del servidor" });
  }
});

// PATCH Actualizar solo el estado de una cita por ID
app.patch('/api/appointments/:id/status', async (req, res) => { // Removido authenticateToken y isAdmin
  const appointmentId = parseInt(req.params.id);
  const { status } = req.body;

   if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "ID de cita inválido." });
  }
  if (!status) {
       return res.status(400).json({ message: "El nuevo estado es requerido." });
  }

  try {
       const request = pool.request();
      request.input('AppointmentID', sql.Int, appointmentId);
      request.input('Status', sql.NVarChar, status);
      request.input('UpdatedAt', sql.DateTime2, new Date());

       const query = `
          UPDATE Appointments
          SET Status = @Status, UpdatedAt = @UpdatedAt
          OUTPUT INSERTED.AppointmentID, INSERTED.Status, INSERTED.UpdatedAt
          WHERE AppointmentID = @AppointmentID;
      `;

       request.query(query, (err, result) => {
          if (err) {
              console.error(`Error actualizando estado de cita ${appointmentId}:`, err);
              return res.status(500).json({ message: "Error interno al actualizar estado" });
          }
          if (result.rowsAffected[0] === 0) {
              return res.status(404).json({ message: "Cita no encontrada." });
          }
          res.json(result.recordset[0]);
      });

  } catch (error) {
      console.error(`Error en PATCH /api/appointments/${appointmentId}/status:`, error);
      res.status(500).json({ message: "Error interno del servidor" });
  }
});


// --- Rutas de Usuarios (Users) --- (Simplificadas)

// GET Buscar usuarios (abierto)
app.get('/api/users', async (req, res) => { // Removido authenticateToken y isAdmin
  const { search } = req.query;

  try {
      let query = `
          SELECT ID, FullName, Email, PhoneNumber
          FROM Users
      `;
      const request = pool.request();
      const conditions = [];

      if (search) {
           conditions.push("(FullName LIKE @Search OR Email LIKE @Search)");
           request.input('Search', sql.NVarChar, `%${search}%`);
      }

       if (conditions.length > 0) {
          query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY FullName;";

      request.query(query, (err, result) => {
          if (err) {
               console.error("Error buscando usuarios:", err);
              return res.status(500).json({ message: "Error interno del servidor" });
          }
          res.json(result.recordset);
      });

  } catch (error) {
       console.error("Error en GET /api/users:", error);
      res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post('/api/feedback', async (req, res) => {
  const { appointmentId, rating, comments } = req.body;

  if (!pool) { /* ... */ }
  if (!appointmentId || (rating == null && !comments)) { /* ... */ }
  if (rating != null && (typeof rating !== 'number' || rating < 1 || rating > 5)) { /* ... */ }

  try {
      // Verificar cita (opcional)
      /* ... */
      // Insertar feedback
      const insertRequest = pool.request();
      insertRequest.input('AppointmentID', sql.Int, appointmentId);
      insertRequest.input('Rating', sql.Int, rating);
      insertRequest.input('Comments', sql.NVarChar, comments);
      const insertQuery = `
          INSERT INTO ServiceFeedback (AppointmentID, Rating, Comments)
          OUTPUT INSERTED.*
          VALUES (@AppointmentID, @Rating, @Comments);
      `;
      const insertResult = await insertRequest.query(insertQuery);
      res.status(201).json(insertResult.recordset[0]);
  } catch (error) {
      if (error.number === 2627 || error.message.toLowerCase().includes('unique constraint')) {
          /* ... (manejo error duplicado) ... */
      }
      console.error("Error en POST /api/feedback:", error.message);
      res.status(500).json({ message: "Error interno al guardar la opinión." });
  }
});

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// ---------- INICIO SECCIÓN BILLING API (server.js) ----------
// =======================================================================
//  INICIO - BLOQUE COMPLETO Y CORREGIDO DE RUTAS API PARA BILLING (server.js)
// =======================================================================

// --- Rutas de Catálogo de Servicios ---
app.get('/api/services', async (req, res) => {
    // #swagger.tags = ['Services']
    // #swagger.summary = 'Obtener lista de servicios del catálogo'
    if (!pool) { return res.status(500).json({ message: "Error interno: Conexión no lista." }); }
    try {
        const request = pool.request();
        const result = await request.query("SELECT ServiceID, Name, Description, DefaultPrice FROM Services ORDER BY Name");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error en GET /api/services:", error.message);
        res.status(500).json({ message: "Error interno al obtener servicios." });
    }
});

// --- Rutas de Usuarios (Dependencia para Facturación) ---
app.get('/api/users', async (req, res) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = '(Dependencia Billing) Obtener lista de usuarios (clientes) con opción de búsqueda'
    if (!pool) { return res.status(500).json({ message: "Error interno: Conexión no lista." }); }
    const { search } = req.query;
    try {
        let query = `SELECT ID, FullName, Email, PhoneNumber FROM Users WHERE 1=1 `;
        const request = pool.request();
        if (search) { query += " AND (FullName LIKE @Search OR Email LIKE @Search)"; request.input('Search', sql.NVarChar, `%${search}%`); }
        query += " ORDER BY FullName;";
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error en GET /api/users:", error.message);
        res.status(500).json({ message: "Error al buscar usuarios." });
    }
});

// --- Rutas de Citas (Dependencia para Facturación) ---



// --- Rutas de Facturación (Invoices & Billing) ---

// GET /api/billing/summary - Obtener resumen
app.get('/api/billing/summary', async (req, res) => {
    // #swagger.tags = ['Billing']
    // #swagger.summary = 'Obtener resumen de facturación para dashboard admin'
    if (!pool) { return res.status(500).json({ message: "Error DB" }); }
    try {
        const statusQuery = `SELECT Status, COUNT(*) AS Count, SUM(CASE WHEN Status = 'paid' THEN TotalAmount ELSE 0 END) AS AmountSum FROM Invoices GROUP BY Status;`;
        const overdueQuery = `SELECT COUNT(*) AS OverdueCount FROM Invoices WHERE Status = 'pending' AND DueDate IS NOT NULL AND DueDate < GETDATE();`; // Requiere DueDate
        const requestStatus = pool.request(); const requestOverdue = pool.request();
        const [statusResult, overdueResult] = await Promise.all([ requestStatus.query(statusQuery), requestOverdue.query(overdueQuery) ]);
        const summary = { total: 0, pending: 0, overdue: 0, paid: 0, cancelled: 0, revenue: 0.00 };
        statusResult.recordset.forEach(row => { summary.total += row.Count; const statusKey = row.Status?.toLowerCase(); if (statusKey && summary.hasOwnProperty(statusKey)) summary[statusKey] = row.Count; if (statusKey === 'paid') summary.revenue = parseFloat(row.AmountSum || 0); });
        summary.overdue = overdueResult.recordset[0]?.OverdueCount || 0;
        res.json(summary);
    } catch (error) {
        console.error("Error en GET /api/billing/summary:", error.message);
        res.status(500).json({ message: "Error interno al obtener resumen." });
    }
});

// GET /api/invoices - Obtener lista de facturas (con filtros)
app.get('/api/invoices', async (req, res) => {
   // #swagger.tags = ['Invoices']
   // ... (swagger params) ...
   if (!pool) { return res.status(500).json({ message: "Error DB" }); }
   const { search, status, startDate, endDate, userId } = req.query;
   try {
      let query = `SELECT I.InvoiceID, I.UserID, I.InvoiceDate, I.DueDate, I.TotalAmount, I.Status, U.FullName AS ClientFullName FROM Invoices I LEFT JOIN Users U ON I.UserID = U.ID WHERE 1=1`;
      const request = pool.request(); const conditions = [];
      if (status) { conditions.push("I.Status = @Status"); request.input('Status', sql.NVarChar, status); }
      if (search) { conditions.push(`(CAST(I.InvoiceID AS NVARCHAR(20)) = @SearchExact OR U.FullName LIKE @SearchPattern OR U.Email LIKE @SearchPattern)`); let searchExact = search.toUpperCase().startsWith('#INV-') ? search.substring(5) : search; if (!/^\d+$/.test(searchExact)) searchExact = '-1'; request.input('SearchExact', sql.NVarChar, searchExact); request.input('SearchPattern', sql.NVarChar, `%${search}%`); }
      if (startDate) { conditions.push("I.InvoiceDate >= @StartDate"); request.input('StartDate', sql.Date, startDate); }
      if (endDate) { conditions.push("I.InvoiceDate <= @EndDate"); request.input('EndDate', sql.Date, endDate); }
      if (userId && !isNaN(parseInt(userId))) { conditions.push("I.UserID = @UserID"); request.input('UserID', sql.Int, parseInt(userId)); }
      if (conditions.length > 0) { query += " AND " + conditions.join(" AND "); }
      query += " ORDER BY I.InvoiceDate DESC;";
      const result = await request.query(query);
      const invoices = result.recordset.map(inv => ({ ...inv, User: { FullName: inv.ClientFullName || null } }));
      res.json(invoices);
   } catch (error) {
      console.error("Error en GET /api/invoices:", error.message);
      res.status(500).json({ message: "Error interno al obtener facturas." });
   }
});

// POST /api/invoices - Crear nueva factura
app.post('/api/invoices', async (req, res) => {
    // #swagger.tags = ['Invoices']
    // ... (swagger params) ...
    if (!pool) { return res.status(500).json({ message: "Error DB" }); }
    const { userId, appointmentId, discount, taxRate, status, items } = req.body;

    // Validación robusta
    const errors = [];
    if (!userId || isNaN(parseInt(userId))) { errors.push("UserID inválido o faltante."); }
    if (!status || !['pending', 'paid'].includes(status.toLowerCase())) { errors.push("Estado inválido (debe ser 'pending' o 'paid')."); }
    if (!items || !Array.isArray(items) || items.length === 0) { errors.push("Se requiere al menos un item."); }
    else {
        items.forEach((item, index) => {
            if (!item.description?.trim()) { errors.push(`Item ${index + 1}: Descripción requerida.`); }
            const quantity = parseInt(item.quantity || '1');
            const unitPrice = parseFloat(item.unitPrice || '0');
            if (isNaN(quantity) || quantity <= 0) { errors.push(`Item ${index + 1} (${item.description || ''}): Cantidad inválida (${item.quantity}).`); }
            if (isNaN(unitPrice) || unitPrice < 0) { errors.push(`Item ${index + 1} (${item.description || ''}): Precio Unitario inválido (${item.unitPrice}).`); }
        });
    }
    if (errors.length > 0) { return res.status(400).json({ message: "Errores de validación.", errors }); }

    let transaction;
    try {
        transaction = pool.transaction(); await transaction.begin();
        console.log("--- Iniciando Transacción Creación Factura ---");

        // 1. Calcular Totales CORRECTAMENTE
        let subtotal = 0;
        console.log("--- Calculando Subtotal de Items ---");
        items.forEach((item, index) => {
            const quantity = parseInt(item.quantity || '1'); const unitPrice = parseFloat(item.unitPrice || '0');
            if (!isNaN(quantity) && !isNaN(unitPrice)) { console.log(`  Item ${index + 1}: Qty=${quantity}, Price=${unitPrice.toFixed(2)}, LineTotal=${(quantity * unitPrice).toFixed(2)}`); subtotal += quantity * unitPrice; }
        });
        let discountAmount = 0; const discountValue = discount || '0';
        if (typeof discountValue === 'string' && discountValue.endsWith('%')) { const percent = parseFloat(discountValue.replace('%', '')) || 0; discountAmount = subtotal * (percent / 100); }
        else { discountAmount = parseFloat(discountValue) || 0; }
        discountAmount = Math.max(0, discountAmount);
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount); const taxRatePercent = parseFloat(taxRate || '0'); const taxAmount = subtotalAfterDiscount * (taxRatePercent / 100);
        const totalAmount = subtotalAfterDiscount + taxAmount;
        console.log(`--- Totales Calculados --- [...] >>> Monto Total Final: ${totalAmount.toFixed(2)}`); // Log resumido
        if (isNaN(totalAmount) || totalAmount < 0) { throw new Error("Error cálculo total."); }
        const invoiceDate = new Date(); const dueDate = new Date(invoiceDate); dueDate.setDate(dueDate.getDate() + 30);

        // 2. Insertar en Invoices
        const invoiceRequest = transaction.request();
        invoiceRequest.input('UserID', sql.Int, userId); invoiceRequest.input('AppointmentID', sql.Int, appointmentId || null); invoiceRequest.input('InvoiceDate', sql.DateTime2, invoiceDate); invoiceRequest.input('DueDate', sql.DateTime2, dueDate);
        invoiceRequest.input('Subtotal', sql.Decimal(10, 2), subtotal); invoiceRequest.input('Discount', sql.Decimal(10, 2), discountAmount); invoiceRequest.input('TaxAmount', sql.Decimal(10, 2), taxAmount);
        invoiceRequest.input('TotalAmount', sql.Decimal(10, 2), totalAmount); // <-- VALOR CALCULADO
        invoiceRequest.input('Status', sql.NVarChar, status.toLowerCase());
        const invoiceQuery = `INSERT INTO Invoices ([UserID], [AppointmentID], [InvoiceDate], [DueDate], [Subtotal], [Discount], [TaxAmount], [TotalAmount], [Status]) OUTPUT INSERTED.InvoiceID, INSERTED.TotalAmount, INSERTED.Status, INSERTED.InvoiceDate, INSERTED.UserID, INSERTED.DueDate VALUES (@UserID, @AppointmentID, @InvoiceDate, @DueDate, @Subtotal, @Discount, @TaxAmount, @TotalAmount, @Status);`;
        const invoiceResult = await invoiceRequest.query(invoiceQuery); const newInvoiceId = invoiceResult.recordset[0].InvoiceID; const createdInvoiceHeader = invoiceResult.recordset[0];
        console.log(`--- Inserción Invoices OK (ID: ${newInvoiceId}, Total Insertado: ${createdInvoiceHeader.TotalAmount}) ---`);

        // 3. Insertar en InvoiceItems
        const itemRequest = transaction.request();
        for (const item of items) {
             const currentQuantity = parseInt(item.quantity || '1'); const currentPrice = parseFloat(item.unitPrice || '0'); const currentServiceId = item.serviceId || null; const currentDescription = item.description?.trim() || 'N/A';
             itemRequest.input('InvoiceID_Item', sql.Int, newInvoiceId); itemRequest.input('ServiceID_Item', sql.Int, currentServiceId); itemRequest.input('Description_Item', sql.NVarChar, currentDescription);
             itemRequest.input('Quantity_Item', sql.Int, currentQuantity); itemRequest.input('UnitPrice_Item', sql.Decimal(10, 2), currentPrice);
             const itemQuery = `INSERT INTO InvoiceItems ([InvoiceID], [ServiceID], [Description], [Quantity], [UnitPrice]) VALUES (@InvoiceID_Item, @ServiceID_Item, @Description_Item, @Quantity_Item, @UnitPrice_Item);`;
             await itemRequest.query(itemQuery);
        }
        console.log(`--- Fin inserción de items ---`);

        // 4. Commit
        await transaction.commit();
        console.log(`--- Transacción completada para InvoiceID: ${newInvoiceId} ---`);
        res.status(201).json({ message: `Factura #${newInvoiceId} creada.`, invoice: createdInvoiceHeader });
    } catch (error) {
        console.error("Error en POST /api/invoices:", error);
        if (transaction?.active) { try { await transaction.rollback(); console.log("Rollback por error."); } catch (rbErr) { console.error("Error en Rollback:", rbErr); } }
        res.status(500).json({ message: `Error al crear factura: ${error.originalError?.message || error.message || 'Error desconocido.'}` });
    }
});


// PATCH /api/invoices/:id/status - Actualizar estado
app.patch('/api/invoices/:id/status', async (req, res) => {
   // #swagger.tags = ['Invoices']
   // ... (swagger params) ...
   if (!pool) { return res.status(500).json({ message: "Error DB" }); }
   const invoiceId = parseInt(req.params.id); const { status } = req.body;
   const validStatuses = ['pending', 'paid', 'cancelled', 'overdue'];
   if (isNaN(invoiceId)) return res.status(400).json({ message: "ID inválido." });
   if (!status || !validStatuses.includes(status.toLowerCase())) return res.status(400).json({ message: `Estado inválido.` });
   try {
       const request = pool.request(); request.input('InvoiceID', sql.Int, invoiceId); request.input('Status', sql.NVarChar, status.toLowerCase());
       const query = `UPDATE Invoices SET Status = @Status WHERE InvoiceID = @InvoiceID; SELECT @@ROWCOUNT AS RowsAffected;`;
       const result = await request.query(query);
       if (result.recordset[0]?.RowsAffected === 0) return res.status(404).json({ message: "Factura no encontrada." });
       res.json({ InvoiceID: invoiceId, Status: status.toLowerCase() });
   } catch (error) {
       console.error(`Error en PATCH /api/invoices/${invoiceId}/status:`, error.message);
       res.status(500).json({ message: "Error interno al actualizar estado." });
   }
});

// GET /api/invoices/:id - Obtener detalles de UNA factura
app.get('/api/invoices/:id', async (req, res) => {
    // #swagger.tags = ['Invoices']
    // #swagger.summary = 'Obtener detalles completos de una factura específica'
    /* #swagger.parameters['id'] = { description: 'ID de la factura', type: 'integer', required: true } */
    if (!pool) { return res.status(500).json({ message: "Error DB" }); }
    const invoiceId = parseInt(req.params.id); if (isNaN(invoiceId)) { return res.status(400).json({ message: "ID inválido." }); }
    try {
        const request = pool.request(); request.input('InvoiceID', sql.Int, invoiceId);
        const headerQuery = `SELECT I.*, U.FullName AS ClientFullName, U.Email AS ClientEmail, U.PhoneNumber AS ClientPhone FROM Invoices I LEFT JOIN Users U ON I.UserID = U.ID WHERE I.InvoiceID = @InvoiceID;`;
        const itemsQuery = `SELECT IT.* FROM InvoiceItems IT WHERE IT.InvoiceID = @InvoiceID ORDER BY InvoiceItemID;`;
        const [headerResult, itemsResult] = await Promise.all([ request.query(headerQuery), request.query(itemsQuery) ]);
        if (!headerResult.recordset?.length) { return res.status(404).json({ message: "Factura no encontrada." }); }
        const header = headerResult.recordset[0];
        const invoiceData = {
            invoiceHeader: { ...( ({ClientFullName, ClientEmail, ClientPhone, ...rest}) => rest )(header), User: { FullName: header.ClientFullName, Email: header.ClientEmail, PhoneNumber: header.ClientPhone } },
            items: itemsResult.recordset || [] };
        res.json(invoiceData);
    } catch (error) {
        console.error(`Error en GET /api/invoices/${invoiceId}:`, error.message);
        res.status(500).json({ message: "Error interno al obtener detalles." });
    }
});


// GET /api/invoices/:id/download - Descargar factura como PDF
app.get('/api/invoices/:id/download', async (req, res) => {
    // #swagger.tags = ['Invoices']
    // #swagger.summary = 'Generar y descargar una factura en formato PDF'
    /* #swagger.parameters['id'] = { description: 'ID de la factura', type: 'integer', required: true } */
    if (!pool) { return res.status(500).send("Error DB."); }
    const invoiceId = parseInt(req.params.id); if (isNaN(invoiceId)) { return res.status(400).send("ID inválido."); }
    try {
        // 1. Obtener datos
        const request = pool.request(); request.input('InvoiceID', sql.Int, invoiceId);
        const headerQuery = `SELECT I.*, U.FullName, U.Email, U.PhoneNumber FROM Invoices I LEFT JOIN Users U ON I.UserID = U.ID WHERE I.InvoiceID = @InvoiceID;`;
        const itemsQuery = `SELECT * FROM InvoiceItems WHERE InvoiceID = @InvoiceID ORDER BY InvoiceItemID;`;
        const [headerResult, itemsResult] = await Promise.all([ request.query(headerQuery), request.query(itemsQuery) ]);
        if (!headerResult.recordset?.length) { return res.status(404).send("Factura no encontrada."); }
        const invoice = headerResult.recordset[0]; const items = itemsResult.recordset || [];

        // 2. Crear PDF y configurar respuesta
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const filename = `Factura-INV-${String(invoiceId).padStart(3, '0')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        // --- Contenido del PDF (Ajusta tus datos y diseño) ---
        const jump = 15; const itemX = 40; const qtyX = 340; const priceX = 400; const totalX = 480; const tableRight = 555; const totalsX = 380;
        // Emisor (¡CAMBIA ESTO!)
        doc.fontSize(16).font('Helvetica-Bold').text('AutoCare Rodriguez', { align: 'right' }); // Alineado a la derecha ahora
        doc.font('Helvetica').fontSize(10);
        doc.text('Tu Dirección Aquí', { align: 'right' });
        doc.text('Ciudad, CP', { align: 'right' });
        doc.text('Tel: Tu Tel | Email: tu@email.com', { align: 'right' });
        doc.moveDown(2); // Espacio
        // Cliente y Factura Info
        const initialY = doc.y; // Guardar Y actual
        doc.fontSize(11).font('Helvetica-Bold').text('Facturar a:', itemX, initialY);
        doc.font('Helvetica').fontSize(10);
        doc.text(invoice.FullName || 'N/A', itemX, initialY + jump);
        if (invoice.Email) doc.text(invoice.Email, itemX, initialY + jump * 2);
        if (invoice.PhoneNumber) doc.text(invoice.PhoneNumber, itemX, initialY + jump * 3);
        doc.fontSize(11).font('Helvetica-Bold').text(`Factura #: INV-${String(invoiceId).padStart(3, '0')}`, 350, initialY);
        doc.font('Helvetica').fontSize(10);
        doc.text(`Fecha Emisión: ${new Date(invoice.InvoiceDate).toLocaleDateString('es-MX')}`, 350, initialY + jump);
        doc.text(`Vencimiento: ${invoice.DueDate ? new Date(invoice.DueDate).toLocaleDateString('es-MX') : 'N/A'}`, 350, initialY + jump * 2);
        doc.font('Helvetica-Bold').text(`Estado: ${invoice.Status?.toUpperCase() || 'N/A'}`, 350, initialY + jump * 3);
        doc.y = initialY + jump * 4 + 10; // Mover Y debajo de lo más largo

        // --- Tabla de Items ---
        const tableTop = doc.y; let currentY = tableTop + jump; // Ajuste inicial Y
        // Encabezados Tabla
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Descripción', itemX, tableTop, { width: qtyX - itemX - 10 }); // Ancho ajustado
        doc.text('Cant.', qtyX, tableTop, { width: 50, align: 'right' });
        doc.text('P. Unit.', priceX, tableTop, { width: 70, align: 'right' });
        doc.text('Importe', totalX, tableTop, { width: 70, align: 'right' });
        doc.moveTo(itemX, tableTop + jump * 0.8).lineTo(tableRight, tableTop + jump * 0.8).lineWidth(0.5).strokeColor("#aaaaaa").stroke(); // Línea bajo encabezados
        // Items
        doc.font('Helvetica').fontSize(9);
        items.forEach(item => {
             const itemTotal = (item.Quantity || 1) * (item.UnitPrice || 0);
             const descHeight = doc.heightOfString(item.Description || '', { width: qtyX - itemX - 10 }); // Calcular altura texto
             const requiredHeight = Math.max(jump * 0.8, descHeight + 5); // Altura mínima o altura del texto
             // Salto de página si no cabe
             if (currentY + requiredHeight > doc.page.height - doc.page.margins.bottom - 50) { // -50 para espacio de totales
                 doc.addPage();
                 currentY = doc.page.margins.top; // Reiniciar Y arriba
                 // Opcional: Re-dibujar encabezados de tabla en la nueva página
                 doc.font('Helvetica-Bold').fontSize(10).text('Descripción', itemX, currentY).text('Cant.', qtyX, currentY, { width: 50, align: 'right' }).text('P. Unit.', priceX, currentY, { width: 70, align: 'right' }).text('Importe', totalX, currentY, { width: 70, align: 'right' });
                 currentY += jump;
                 doc.moveTo(itemX, currentY).lineTo(tableRight, currentY).lineWidth(0.5).strokeColor("#aaaaaa").stroke();
                 currentY += 5;
             }
             doc.text(item.Description || '', itemX, currentY, { width: qtyX - itemX - 10 });
             doc.text((item.Quantity || 1).toString(), qtyX, currentY, { width: 50, align: 'right' });
             doc.text(`$${(item.UnitPrice || 0).toFixed(2)}`, priceX, currentY, { width: 70, align: 'right' });
             doc.text(`$${itemTotal.toFixed(2)}`, totalX, currentY, { width: 70, align: 'right' });
             currentY += requiredHeight; // Incrementar Y basado en altura real
        });
        doc.moveTo(itemX, currentY).lineTo(tableRight, currentY).lineWidth(0.5).strokeColor("#aaaaaa").stroke(); // Línea final tabla

        // --- Totales ---
         // Asegurar espacio para totales
        if (currentY > doc.page.height - doc.page.margins.bottom - 60) { // Necesita ~60 puntos para totales
            doc.addPage();
            currentY = doc.page.margins.top;
        } else {
            currentY += jump; // Espacio antes de totales
        }
        const totalsYStart = currentY;
        doc.font('Helvetica').fontSize(10);
        doc.text('Subtotal:', totalsX, totalsYStart, { width: 90, align: 'left' }); doc.text(`${formatCurrency(invoice.Subtotal)}`, totalX, totalsYStart, { width: 70, align: 'right'}); currentY += jump;
        doc.text('Descuento:', totalsX, currentY, { width: 90, align: 'left' }); doc.text(`-${formatCurrency(invoice.Discount)}`, totalX, currentY, { width: 70, align: 'right'}); currentY += jump;
        doc.text('Impuestos:', totalsX, currentY, { width: 90, align: 'left' }); doc.text(`+${formatCurrency(invoice.TaxAmount)}`, totalX, currentY, { width: 70, align: 'right'}); currentY += 5;
        doc.moveTo(totalsX - 10, currentY).lineTo(tableRight, currentY).lineWidth(1).strokeColor("#000000").stroke(); currentY += 5;
        doc.font('Helvetica-Bold').fontSize(11).text('TOTAL:', totalsX, currentY, { width: 90, align: 'left' }); doc.text(`${formatCurrency(invoice.TotalAmount)}`, totalX, currentY, { width: 70, align: 'right'});

        // Notas Adicionales
        if (invoice.Notes) {
             if (currentY > doc.page.height - doc.page.margins.bottom - 40) { doc.addPage(); currentY = doc.page.margins.top;} else { doc.moveDown(3);}
             doc.font('Helvetica').fontSize(9).text('Notas:', itemX);
             doc.text(invoice.Notes, { indent: 10, width: tableRight - itemX });
        }

        // --- Fin Contenido PDF ---
        doc.end(); // Finalizar PDF y enviar stream
        console.log(`PDF generado para Factura #${invoiceId}`);
    } catch (error) {
         console.error(`Error en GET /api/invoices/${invoiceId}/download:`, error.message);
         if (!res.headersSent) { res.status(500).send("Error al generar PDF."); } else { res.end(); }
    }
});

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////




// Iniciar servidor
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
