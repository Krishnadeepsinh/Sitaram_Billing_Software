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

const scryptAsync = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });

const hashPassword = async (password: string, salt = crypto.randomBytes(16).toString("hex")) => {
  const derived = await scryptAsync(password, salt);
  return `scrypt$${salt}$${derived.toString("hex")}`;
};

loadEnv();

const username = String(process.env.ADMIN_USERNAME || "admin").trim();
const plainPassword = String(process.env.ADMIN_PASSWORD || "").trim();
const passwordHashFromEnv = String(process.env.ADMIN_PASSWORD_HASH || "").trim();
const mode = process.argv.includes("--cable") ? "cable" : "broadband";

const url = mode === "cable"
  ? process.env.CABLE_TURSO_DATABASE_URL || process.env.VITE_CABLE_TURSO_DATABASE_URL
  : process.env.BROADBAND_TURSO_DATABASE_URL || process.env.VITE_BROADBAND_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL;
const authToken = mode === "cable"
  ? process.env.CABLE_TURSO_AUTH_TOKEN || process.env.VITE_CABLE_TURSO_AUTH_TOKEN
  : process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) throw new Error(`Missing ${mode} Turso credentials in .env.`);
if (!username) throw new Error("Missing ADMIN_USERNAME in .env.");
if (!plainPassword && !passwordHashFromEnv) {
  throw new Error("Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH in .env.");
}

const db = createClient({ url, authToken });

async function run() {
  const passwordHash = plainPassword ? await hashPassword(plainPassword) : passwordHashFromEnv;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'admin',
      status TEXT DEFAULT 'active',
      created_at TEXT
    )
  `);

  const existing = await db.execute({
    sql: "SELECT id FROM admin_users WHERE username = ? LIMIT 1",
    args: [username],
  });

  if (existing.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO admin_users (id, username, password_hash, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [`admin-${crypto.randomUUID()}`, username, passwordHash, "Administrator", "admin", "active", new Date().toISOString()],
    });
    console.log(`Created admin user '${username}' in ${mode} database.`);
  } else {
    const row = existing.rows[0] as { id?: string };
    await db.execute({
      sql: "UPDATE admin_users SET password_hash = ?, status = 'active' WHERE id = ?",
      args: [passwordHash, String(row.id || "")],
    });
    console.log(`Reset password for admin user '${username}' in ${mode} database.`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
