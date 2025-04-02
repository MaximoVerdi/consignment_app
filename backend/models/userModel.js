const db = require("../config/db");

class User {
  // Crear usuario
  static async create(username, passwordHash, role) {
    const [result] = await db.execute(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, passwordHash, role]
    );
    return result;
  }

  // Buscar usuario por username
  static async findByUsername(username) {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows.length ? rows[0] : null;
  }

  // Buscar usuario por ID (incluyendo dirección)
  static async findById(userId) {
    const [userRows] = await db.execute(
      "SELECT user_id, username, email, phone, role, created_at FROM users WHERE user_id = ?",
      [userId]
    );

    if (!userRows.length) return null;

    const [addressRows] = await db.execute(
      "SELECT address, city, state, postal_code, country FROM user_addresses WHERE user_id = ?",
      [userId]
    );

    return {
      ...userRows[0],
      address: addressRows.length ? addressRows[0] : null,
    };
  }

  // Actualizar email y teléfono
  static async updateUser(userId, email, phone) {
    await db.execute(
      "UPDATE users SET email = ?, phone = ? WHERE user_id = ?",
      [email, phone, userId]
    );
  }

  // Actualizar o insertar dirección del usuario
  static async updateUserAddress(
    userId,
    address,
    city,
    state,
    postalCode,
    country
  ) {
    const [existingAddress] = await db.execute(
      "SELECT address_id FROM user_addresses WHERE user_id = ?",
      [userId]
    );

    if (existingAddress.length) {
      await db.execute(
        "UPDATE user_addresses SET address = ?, city = ?, state = ?, postal_code = ?, country = ? WHERE user_id = ?",
        [address, city, state, postalCode, country, userId]
      );
    } else {
      await db.execute(
        "INSERT INTO user_addresses (user_id, address, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, address, city, state, postalCode, country]
      );
    }
  }

  static async updateUserProfile(userId, firstName, lastName) {
    await db.execute(
      "UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?",
      [firstName, lastName, userId]
    );
  }

  static async updatePassword(userId, newPasswordHash) {
    await db.execute("UPDATE users SET password_hash = ? WHERE user_id = ?", [
      newPasswordHash,
      userId,
    ]);
  }
}

module.exports = User;
