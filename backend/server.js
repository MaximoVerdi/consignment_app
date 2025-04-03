const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/authMiddleware");
const authController = require("./controllers/authController");

const {
  mainPool,
  getTenantPool,
  createTenantDatabase,
} = require("./config/db");

dotenv.config({ path: ".env" });
const app = express();

// ======================
// 1. Middlewares Básicos
// ======================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(helmet());
app.use(hpp());
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
// 3. Endpoints
// ======================

// Auth (multi-tenant)
app.post("/api/auth/signup", authController.register);
app.post("/api/auth/login", authController.login);

// Endpoint para crear nuevos tenants (locales)
app.post("/api/tenants", verifyToken, async (req, res) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId || typeof tenantId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Se requiere un ID de tenant válido",
      });
    }

    await createTenantDatabase(tenantId);

    res.json({
      success: true,
      message: `Local ${tenantId} creado exitosamente`,
      databaseName: `consignment_${tenantId}`,
    });
  } catch (error) {
    console.error("Error creando tenant:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
});

app.put("/api/update-user", verifyToken, async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      first_name,
      last_name,
      address,
      city,
      state,
      postal_code,
      country,
      user_id,
    } = req.body;

    const tenantId = req.user.tenant_id || "default";
    const db = await getTenantPool(tenantId);

    if (!db) {
      throw new Error("Database connection not available");
    }

    const updates = [];
    const params = [];

    // Actualizar datos básicos del usuario
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
    if (first_name) {
      updates.push("first_name = ?");
      params.push(first_name);
    }
    if (last_name) {
      updates.push("last_name = ?");
      params.push(last_name);
    }

    if (updates.length > 0) {
      params.push(user_id);
      await db.query(
        `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`,
        params
      );
    }

    // Actualizar dirección
    if (address || city || state || postal_code || country) {
      try {
        const [existingAddress] = await db.query(
          "SELECT address_id FROM user_addresses WHERE user_id = ?",
          [user_id]
        );

        if (existingAddress?.length > 0) {
          await db.query(
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
              postal_code || null,
              country || null,
              user_id,
            ]
          );
        } else {
          await db.query(
            `INSERT INTO user_addresses 
              (user_id, address, city, state, postal_code, country) 
              VALUES (?, ?, ?, ?, ?, ?)`,
            [
              user_id,
              address || "",
              city || "",
              state || "",
              postal_code || "",
              country || "",
            ]
          );
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
      message: error.message,
      code: error.code,
    });
  }
});

// Endpoint para verificar autenticación
app.get("/api/check-auth", verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      ...req.user,
      tenant_id: req.user.tenant_id || "default",
    },
  });
});

// Endpoint para obtener perfil de usuario
app.get("/api/profile/:userId", verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const tenantId = req.user.tenant_id || "default";

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario inválido",
        code: "INVALID_USER_ID",
      });
    }

    const db = await getTenantPool(tenantId);

    // Consulta unificada con LEFT JOIN para evitar múltiples queries
    const [results] = await db.query(
      `SELECT 
        u.user_id as userId,
        u.username,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.role,
        a.address,
        a.city,
        a.state,
        a.postal_code as postal_code,
        a.country
      FROM users u
      LEFT JOIN user_addresses a ON u.user_id = a.user_id
      WHERE u.user_id = ?`,
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      success: true,
      data: {
        ...results[0],
        address: results[0].address || "",
        city: results[0].city || "",
        state: results[0].state || "",
        postal_code: results[0].postal_code || "",
        country: results[0].country || "",
      },
    });
  } catch (error) {
    console.error("Error en /api/profile:", error);

    if (error.code === "ER_BAD_DB_ERROR") {
      return res.status(500).json({
        success: false,
        message: "Base de datos del local no encontrada",
        code: "TENANT_DB_NOT_FOUND",
        solution: "Contacte al administrador",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});

// Endpoint para productos
app.get("/api/products", verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || "default";
    const db = await getTenantPool(tenantId);

    const [products] = await db.query(
      "SELECT * FROM products WHERE tenant_id = ?",
      [tenantId]
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error obteniendo productos:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Endpoint para consignatarios
app.get("/api/consignors", verifyToken, async (req, res) => {
  try {
    const tenantId = req.user.tenant_id || "default";
    const db = await getTenantPool(tenantId);

    const [consignors] = await db.query(
      "SELECT * FROM consignors WHERE tenant_id = ?",
      [tenantId]
    );

    res.json({
      success: true,
      data: consignors,
    });
  } catch (error) {
    console.error("Error obteniendo consignatarios:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================
// 5. Manejo de Errores
// ======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// ======================
// 6. Inicio del Servidor
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Base de datos principal: consignment_db`);
});

module.exports = app; // Para testing
