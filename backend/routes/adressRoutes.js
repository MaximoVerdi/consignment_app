const express = require("express");
const {
  getAddressByUserId,
  saveOrUpdateAddress,
} = require("../models/addressModel");

const router = express.Router();

router.get("/get-address/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const address = await getAddressByUserId(userId);
    res.json(address);
  } catch (error) {
    console.error("Error obteniendo dirección:", error);
    res.status(500).json({ message: "Error obteniendo dirección" });
  }
});

router.put("/update-address", async (req, res) => {
  try {
    const { userId, address, city, state, postalCode, country } = req.body;
    await saveOrUpdateAddress(
      userId,
      address,
      city,
      state,
      postalCode,
      country
    );
    res.json({ message: "✅ Dirección actualizada correctamente" });
  } catch (error) {
    console.error("Error actualizando dirección:", error);
    res.status(500).json({ message: "Error actualizando dirección" });
  }
});

module.exports = router;
