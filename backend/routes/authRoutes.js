const express = require("express");
const { register, login } = require("../controllers/authController");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    console.log("📩 Recibido en backend:", req.body);

    const { username, password } = req.body;
    if (!username || !password) {
      console.log("❌ Faltan datos");
      return res.status(400).json({ message: "Faltan datos" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar usuario en la base de datos
    const newUser = await db.query(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hashedPassword]
    );

    console.log("✅ Usuario creado:", newUser);
    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("❌ Error en signup:", error);
    res.status(500).json({ message: "Error creando usuario" });
  }
});

router.put("/update-user", async (req, res) => {
  try {
    const {
      user_id,
      email,
      phone,
      password,
      address,
      city,
      state,
      postalCode,
      country,
    } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ message: "El ID del usuario es obligatorio" });
    }

    // Actualizar datos del usuario en la tabla users
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

    if (updates.length > 0) {
      params.push(user_id);
      const query = `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`;
      await db.execute(query, params);
    }

    // Actualizar o insertar dirección del usuario en la tabla user_addresses
    if (address || city || state || postalCode || country) {
      const [existingAddress] = await db.execute(
        "SELECT address_id FROM user_addresses WHERE user_id = ?",
        [user_id]
      );

      if (existingAddress.length) {
        await db.execute(
          "UPDATE user_addresses SET address = ?, city = ?, state = ?, postal_code = ?, country = ? WHERE user_id = ?",
          [address, city, state, postalCode, country, user_id]
        );
      } else {
        await db.execute(
          "INSERT INTO user_addresses (user_id, address, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?)",
          [user_id, address, city, state, postalCode, country]
        );
      }
    }

    res.json({ message: "✅ Datos actualizados correctamente" });
  } catch (error) {
    console.error("❌ Error actualizando usuario:", error);
    res.status(500).json({ message: "Error actualizando usuario" });
  }
});
router.post("/login", login);

module.exports = router;
