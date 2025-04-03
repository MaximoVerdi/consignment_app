const { mainPool } = require("../config/db");
const fs = require("fs");

async function createTenant(tenantId) {
  await mainPool.query(
    `CREATE DATABASE IF NOT EXISTS consignment_tenant_${tenantId}`
  );

  const createTablesSQL = fs.readFileSync("schema.sql", "utf-8");
  const tenantPool = await getTenantPool(tenantId);

  await tenantPool.query(createTablesSQL);
  console.log(`✅ Tenant ${tenantId} creado`);
}
