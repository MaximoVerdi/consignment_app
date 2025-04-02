const db = require("../config/db");

class Product {
  static async create(productData) {
    const {
      name,
      description,
      category,
      net_price,
      sale_price,
      quantity,
      consignee_id,
      date_added,
      status,
      brand,
      size,
    } = productData;

    const [result] = await db.execute(
      `INSERT INTO products 
      (name, description, category, net_price, sale_price, quantity, consignee_id, date_added, status, brand, size) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        category,
        net_price,
        sale_price,
        quantity,
        consignee_id,
        date_added,
        status,
        brand,
        size,
      ]
    );
    return result;
  }

  static async getAll() {
    const [rows] = await db.execute("SELECT * FROM products");
    return rows;
  }

  static async getById(product_id) {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE product_id = ?",
      [product_id]
    );
    return rows.length ? rows[0] : null;
  }

  static async update(product_id, updatedData) {
    const fields = Object.keys(updatedData)
      .map((key) => `${key} = ?`)
      .join(", ");

    const values = Object.values(updatedData);
    values.push(product_id);

    const [result] = await db.execute(
      `UPDATE products SET ${fields} WHERE product_id = ?`,
      values
    );
    return result;
  }

  static async delete(product_id) {
    const [result] = await db.execute(
      "DELETE FROM products WHERE product_id = ?",
      [product_id]
    );
    return result;
  }
}

module.exports = Product;
