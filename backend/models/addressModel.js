const db = require("../config/db");

const getAddressByUserId = async (userId) => {
  const [address] = await db.query(
    "SELECT address, city, state, postal_code, country FROM user_addresses WHERE user_id = ?",
    [userId]
  );
  return address || {};
};

const saveOrUpdateAddress = async (
  userId,
  address,
  city,
  state,
  postalCode,
  country
) => {
  const [existingAddress] = await db.query(
    "SELECT address_id FROM user_addresses WHERE user_id = ?",
    [userId]
  );

  if (existingAddress) {
    await db.query(
      "UPDATE user_addresses SET address = ?, city = ?, state = ?, postal_code = ?, country = ? WHERE user_id = ?",
      [address, city, state, postalCode, country, userId]
    );
  } else {
    await db.query(
      "INSERT INTO user_addresses (user_id, address, city, state, postal_code, country) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, address, city, state, postalCode, country]
    );
  }
};

module.exports = { getAddressByUserId, saveOrUpdateAddress };
