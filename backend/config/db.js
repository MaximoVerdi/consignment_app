const mysql = require("mysql2/promise");
require("dotenv").config();

const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASS", "DB_NAME"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Falta la variable de entorno requerida: ${envVar}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "local",
  charset: "utf8mb4",
  connectTimeout: 10000,
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión a la base de datos establecida correctamente");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
    process.exit(1);
  }
})();

pool.on("connection", (connection) => {
  console.log("Nueva conexión establecida:", connection.threadId);
});

pool.on("acquire", (connection) => {
  console.log("Conexión adquirida:", connection.threadId);
});

pool.on("release", (connection) => {
  console.log("Conexión liberada:", connection.threadId);
});

pool.on("enqueue", () => {
  console.log("Esperando conexión disponible...");
});

module.exports = pool;
