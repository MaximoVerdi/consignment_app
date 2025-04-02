const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario en la base de datos
    await User.create(username, passwordHash, role);
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

const login = async (req, res) => {
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
    res.status(500).json({ message: "Error logging in" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user_id: user.user_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

const getUserProfile = async (req, res) => {
  console.log("Ruta /api/profile fue llamada");
  try {
    const userId = req.user?.user_id;
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const user = await User.findById(userId);
    console.log("Usuario encontrado:", user);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { getUserProfile };

module.exports = { register, login, getUserById, getUserProfile };
