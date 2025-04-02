const Product = require("../models/productModel");

const createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json({ message: "Producto agregado", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Error al agregar el producto", error });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos", error });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener producto", error });
  }
};

const updateProduct = async (req, res) => {
  try {
    await Product.update(req.params.id, req.body);
    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el producto", error });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.delete(req.params.id);
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el producto", error });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
