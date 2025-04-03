const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { mainPool, getTenantPool } = require("../config/db");

const register = async (req, res) => {
  try {
    const { username, password, role, tenantId = "default" } = req.body;

    if (tenantId !== "default" && req.user?.role !== "admin") {
      return res.status(403).json({
        message: "Solo admins pueden crear usuarios en tenants específicos",
      });
    }

    const db =
      tenantId === "default" ? mainPool : await getTenantPool(tenantId);

    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await db.query(
      "INSERT INTO users (username, password_hash, role, tenant_id) VALUES (?, ?, ?, ?)",
      [username, passwordHash, role, tenantId]
    );

    res.status(201).json({
      message: "User created successfully",
      tenantId,
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password, tenantId = "default" } = req.body;

    if (tenantId !== "default" && !(await validateTenant(tenantId))) {
      return res.status(400).json({ message: "Tenant no válido" });
    }

    const db =
      tenantId === "default" ? mainPool : await getTenantPool(tenantId);

    const [users] = await db.query(
      `SELECT user_id, username, password_hash, role, tenant_id 
       FROM users WHERE username = ? AND tenant_id = ?`,
      [username, tenantId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        tenant_id: user.tenant_id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await req.db.query(
      "SELECT * FROM users WHERE user_id = ? AND tenant_id = ?",
      [id, req.tenantId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    res.json({
      user_id: user.user_id,
      username: user.username,
      firstName: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      tenant_id: user.tenant_id,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const tenantId = req.user?.tenant_id || "default";

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // Conexión al tenant correcto
    const db =
      tenantId === "default" ? mainPool : await getTenantPool(tenantId);

    const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = users[0];
    res.json({
      username: user.username,
      email: user.email,
      tenant_id: user.tenant_id,
    });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  register,
  login,
  getUserById,
  getUserProfile,
};
