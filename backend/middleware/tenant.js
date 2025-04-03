// middleware/tenant.js
const { getTenantPool } = require("../config/db");

async function tenantMiddleware(req, res, next) {
  // Obtener tenantId de:
  // - JWT (si los usuarios están asociados a un local)
  // - Subdominio (ej: local1.tudominio.com)
  // - Header HTTP (ej: x-tenant-id)
  const tenantId =
    req.user?.tenantId || req.headers["x-tenant-id"] || "default";

  try {
    req.db =
      tenantId === "default" ? req.mainPool : await getTenantPool(tenantId);

    req.tenantId = tenantId;
    next();
  } catch (error) {
    console.error(`Error en tenant ${tenantId}:`, error);
    res.status(500).json({ error: "Error de base de datos" });
  }
}

module.exports = tenantMiddleware;
