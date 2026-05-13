import { createClient } from "@libsql/client";
import crypto from "node:crypto";
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

const username = String(process.env.ADMIN_USERNAME || "adminshakti").trim();
const plainPassword = String(process.env.ADMIN_PASSWORD || "Shaktisinh@22").trim();
const mode = process.argv.includes("--cable") ? "cable" : "broadband";

const url = mode === "cable"
  ? process.env.CABLE_TURSO_DATABASE_URL || process.env.VITE_CABLE_TURSO_DATABASE_URL
  : process.env.BROADBAND_TURSO_DATABASE_URL || process.env.VITE_BROADBAND_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL;
const authToken = mode === "cable"
  ? process.env.CABLE_TURSO_AUTH_TOKEN || process.env.VITE_CABLE_TURSO_AUTH_TOKEN
  : process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) throw new Error(`Missing ${mode} Turso credentials in .env.`);
if (!username) throw new Error("Missing ADMIN_USERNAME in .env.");
if (!plainPassword) throw new Error("Set ADMIN_PASSWORD in .env.");

const db = createClient({ url, authToken });

async function run() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_text TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'admin',
      status TEXT DEFAULT 'active',
      created_at TEXT
    )
  `);

  try {
    await db.execute("ALTER TABLE admin_users ADD COLUMN password_text TEXT");
  } catch {
    // Column already exists.
  }

  await db.execute("DELETE FROM admin_users");
  await db.execute({
    sql: "INSERT INTO admin_users (id, username, password_text, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [`admin-${crypto.randomUUID()}`, username, plainPassword, "Administrator", "admin", "active", new Date().toISOString()],
  });
  console.log(`Recreated admin user '${username}' in ${mode} database.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
