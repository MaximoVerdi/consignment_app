const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyToken, createProduct);
router.get("/", verifyToken, getProducts);
router.get("/:id", verifyToken, getProductById);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;
