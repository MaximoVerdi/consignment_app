const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const bcrypt = require("bcrypt");
const User = require("./models/userModel");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/authMiddleware");

dotenv.config();
const app = express();

// ======================
// 1. Middlewares Básicos
// ======================
app.use(helmet());
app.use(hpp());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cors());

// ======================
// 2. Rate Limiting
// ======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: "Too many requests from this IP, please try again later",
});
app.use("/api/", limiter);

// ======================
// 3. Conexión a la DB
// ======================
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ======================
// 4. Endpoints
// ======================

// Endopoint de signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar usuario en la base de datos
    const newUser = await db.query(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hashedPassword]
    );

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    console.error("❌ Error en signup:", error);
    res.status(500).json({ message: "Error creando usuario" });
  }
});

// Endpoint de login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Intentando login con:", username);

    const user = await User.findByUsername(username);
    console.log("Usuario encontrado:", user);

    if (!user) {
      return res.status(401).json({ message: "Invalid username" });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login exitoso, enviando token y datos...");
    res.json({
      token,
      user_id: user.user_id,
      username: user.username,
    });
  } catch (error) {
    console.error("Error en login:", error);
  }
});

app.put("/api/update-user", verifyToken, async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      address,
      city,
      state,
      postcode,
      country,
    } = req.body;

    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario no identificado",
      });
    }

    const updates = [];
    const params = [];

    if (email) {
      updates.push("email = ?");
      params.push(email);
    }
    if (phone) {
      updates.push("phone = ?");
      params.push(phone);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push("password_hash = ?");
      params.push(hashedPassword);
    }
    if (firstName) {
      updates.push("first_name = ?");
      params.push(firstName);
    }
    if (lastName) {
      updates.push("last_name = ?");
      params.push(lastName);
    }

    if (updates.length > 0) {
      params.push(userId);
      await db.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`,
        params
      );
    }

    if (address || city || state || postcode || country) {
      try {
        console.log("Intentando actualizar dirección con:", {
          userId,
          address,
          city,
          state,
          postcode,
          country,
        });

        // Verificar si existe dirección
        const [existingAddress] = await db.execute(
          "SELECT address_id FROM user_addresses WHERE user_id = ?",
          [userId]
        );

        console.log("Dirección existente:", existingAddress);

        if (existingAddress && existingAddress.length > 0) {
          // Actualizar dirección existente
          const updateResult = await db.execute(
            `UPDATE user_addresses SET 
          address = COALESCE(?, address), 
          city = COALESCE(?, city), 
          state = COALESCE(?, state), 
          postal_code = COALESCE(?, postal_code), 
          country = COALESCE(?, country) 
         WHERE user_id = ?`,
            [
              address || null,
              city || null,
              state || null,
              postcode || null,
              country || null,
              userId,
            ]
          );
          console.log("Resultado de actualización:", updateResult);
        } else {
          // Insertar nueva dirección
          const insertResult = await db.execute(
            `INSERT INTO user_addresses 
          (user_id, address, city, state, postal_code, country) 
         VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId,
              address || "",
              city || "",
              state || "",
              postcode || "",
              country || "",
            ]
          );
          console.log("Resultado de inserción:", insertResult);
        }
      } catch (error) {
        console.error("Error al procesar dirección:", error);
        throw error;
      }
    }

    res.json({
      success: true,
      message: "✅ Datos actualizados correctamente",
    });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al actualizar datos",
    });
  }
});

// Endpoint de prueba para verificar el middleware
app.get("/api/check-auth", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});

// Endpoint de perfil
app.get("/api/profile/:userId", verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Obtener datos básicos del usuario
    const [userRows] = await db.query(
      "SELECT user_id, username, email, phone, first_name, last_name, role, created_at FROM users WHERE user_id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Obtener dirección del usuario
    const [addressRows] = await db.query(
      "SELECT address, city, state, postal_code, country FROM user_addresses WHERE user_id = ?",
      [userId]
    );

    const responseData = {
      ...userRows[0],
      ...(addressRows.length > 0 ? addressRows[0] : {}),
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ======================
// 5. Manejo de Errores
// ======================
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ======================
// 6. Inicio del Servidor
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
