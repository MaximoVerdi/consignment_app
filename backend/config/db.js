const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// 1. Carga robusta del archivo .env
const envPath = path.resolve(__dirname, "..", ".env");
if (!fs.existsSync(envPath)) {
  throw new Error(`❌ No se encontró el archivo .env en: ${envPath}`);
}

const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
  throw new Error(`❌ Error al cargar .env: ${envConfig.error}`);
}

// 2. Validación de variables requeridas
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME"];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(
    `❌ Faltan variables de entorno requeridas: ${missingVars.join(", ")}`
  );
}

// 3. Configuración del pool principal
const mainPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

// 4. Mapa para pools de tenants
const tenantPools = new Map();

// 5. Función para obtener pool de tenant
async function getTenantPool(tenantId) {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error("ID de tenant inválido");
  }

  if (tenantId === "main" || tenantId === "default") {
    return mainPool;
  }

  if (tenantPools.has(tenantId)) {
    return tenantPools.get(tenantId);
  }

  const tenantDbName = `consignment_${tenantId}`;

  try {
    const tenantPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: tenantDbName,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      namedPlaceholders: true,
    });

    // Prueba de conexión
    const conn = await tenantPool.getConnection();
    await conn.ping();
    conn.release();

    tenantPools.set(tenantId, tenantPool);
    return tenantPool;
  } catch (error) {
    if (error.code === "ER_BAD_DB_ERROR") {
      await createTenantDatabase(tenantId);
      return getTenantPool(tenantId);
    }
    throw new Error(
      `Error de conexión con tenant ${tenantId}: ${error.message}`
    );
  }
}

// 6. Función para crear base de datos de tenant
async function createTenantDatabase(tenantId) {
  const tenantDbName = `consignment_${tenantId}`;
  const conn = await mainPool.getConnection();

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\``);
    await conn.query(`USE \`${tenantDbName}\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        role ENUM('admin', 'user') DEFAULT 'user',
        tenant_id VARCHAR(50) DEFAULT 'default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        address_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        address VARCHAR(255),
        city VARCHAR(50),
        state VARCHAR(50),
        postal_code VARCHAR(20),
        country VARCHAR(50),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    console.log(`✅ Base de datos ${tenantDbName} creada exitosamente`);
  } finally {
    conn.release();
  }
}

// 7. Función para cerrar todas las conexiones
async function closeAllPools() {
  await mainPool.end();
  for (const pool of tenantPools.values()) {
    await pool.end();
  }
  tenantPools.clear();
}

// 8. Manejo de cierre limpio
process.on("SIGINT", async () => {
  await closeAllPools();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeAllPools();
  process.exit(0);
});

module.exports = {
  mainPool,
  getTenantPool,
  createTenantDatabase,
  closeAllPools,
};
