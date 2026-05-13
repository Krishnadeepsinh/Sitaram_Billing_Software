import { createClient } from "@libsql/client";
import fs from "node:fs";

const loadEnv = () => {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length && !process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  }
};

loadEnv();

const configs = [
  {
    mode: "Broadband",
    url: process.env.BROADBAND_TURSO_DATABASE_URL || process.env.VITE_BROADBAND_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN,
  },
  {
    mode: "Cable",
    url: process.env.CABLE_TURSO_DATABASE_URL || process.env.VITE_CABLE_TURSO_DATABASE_URL,
    authToken: process.env.CABLE_TURSO_AUTH_TOKEN || process.env.VITE_CABLE_TURSO_AUTH_TOKEN,
  },
].filter((config) => config.url && config.authToken);

if (configs.length === 0) {
  throw new Error("Set Turso database URLs and auth tokens in .env first.");
}

async function check(config: typeof configs[number]) {
  const db = createClient({ url: config.url!, authToken: config.authToken! });
  console.log(`\n${config.mode} DB`);
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("Tables in DB:", tables.rows.map((r) => r.name).join(", "));

  for (const table of ["subscribers", "plans", "payments", "invoices", "company_settings", "admin_users"]) {
    try {
      const count = await db.execute(`SELECT COUNT(*) AS count FROM ${table}`);
      console.log(`${table}: ${count.rows[0]?.count ?? 0}`);
    } catch {
      console.log(`${table}: missing`);
    }
  }
}

Promise.all(configs.map((config) => check(config))).catch((error) => {
  console.error(error);
  process.exit(1);
});
