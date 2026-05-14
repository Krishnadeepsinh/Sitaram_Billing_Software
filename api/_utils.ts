import { createClient } from "@libsql/client";
import crypto from "crypto";
import { VercelRequest, VercelResponse } from "@vercel/node";

export type BusinessMode = "cable" | "broadband";

export const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("CRITICAL: SESSION_SECRET is missing in production environment");
}
const sessionSecret = process.env.SESSION_SECRET || "fallback-secret-for-dev-only";
export const sessionTtlMs = 1000 * 60 * 60 * 12;

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

export const verifyPassword = (password: string, hash: string) => {
  try {
    const [salt, key] = hash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    if (derivedKey.length !== keyBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
};

const configs = {
  broadband: {
    url: process.env.BROADBAND_TURSO_DATABASE_URL || process.env.VITE_BROADBAND_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN,
  },
  cable: {
    url: process.env.CABLE_TURSO_DATABASE_URL || process.env.VITE_CABLE_TURSO_DATABASE_URL,
    authToken: process.env.CABLE_TURSO_AUTH_TOKEN || process.env.VITE_CABLE_TURSO_AUTH_TOKEN,
  },
};

export const getDb = (mode: BusinessMode) => {
  const config = configs[mode];
  if (!config.url || !config.authToken) {
    throw new Error(`${mode} database is not configured.`);
  }

  // Use a local embedded replica that syncs with Turso
  // Note: Vercel functions are read-only, so we use /tmp/ for Vercel, else local directory
  const localDbUrl = process.env.VERCEL === "1" ? `file:/tmp/${mode}_local.db` : `file:./${mode}_local.db`;

  return createClient({ 
    url: localDbUrl, 
    syncUrl: config.url, 
    authToken: config.authToken,
    syncInterval: 2 // Automatically sync every 2 seconds in the background
  });
};

export const sign = (payload: string) =>
  crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");

export const createSession = (userId: string) => {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + sessionTtlMs })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const parseCookies = (cookieHeader: string = "") => {
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
  }
  return cookies;
};

export const readJsonBody = async <T = Record<string, unknown>>(req: VercelRequest): Promise<T> => {
  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }

  if (typeof req.body === "string") {
    return (req.body ? JSON.parse(req.body) : {}) as T;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return (text ? JSON.parse(text) : {}) as T;
};

export const verifySession = (req: VercelRequest) => {
  const token = parseCookies(req.headers.cookie).sitaram_session;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || Date.now() > Number(data.exp)) return null;
    return data as { userId: string; exp: number };
  } catch {
    return null;
  }
};

export const safeCompare = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

type AdminUserRow = {
  id?: string;
  password_hash?: string;
  password_text?: string;
  display_name?: string;
};

export const ensureAdminSchema = async (db: ReturnType<typeof createClient>) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
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
};

const resolveAdminCredentials = () => {
  const username = String(process.env.ADMIN_USERNAME || "").trim() || "adminshakti";
  const password = String(process.env.ADMIN_PASSWORD || "").trim() || "Shaktisinh@22";
  return { username, password };
};

export const ensureAdminUser = async (db: ReturnType<typeof createClient>) => {
  try {
    await ensureAdminSchema(db);
    const { username, password } = resolveAdminCredentials();

    const existingUser = await db.execute({
      sql: "SELECT id, password_hash FROM admin_users WHERE username = ? LIMIT 1",
      args: [username],
    });

    const userRow = existingUser.rows[0];
    const userExists = existingUser.rows.length > 0;
    const storedHash = userRow ? String(userRow.password_hash || "") : "";
    
    // Only sync if user doesn't exist, password changed, or force sync is enabled
    const passwordChanged = userExists && !verifyPassword(password, storedHash);
    const forceSync = String(process.env.SYNC_ADMIN_PASSWORD_ON_BOOT || "").toLowerCase() === "true";
    const shouldSync = !userExists || passwordChanged || forceSync;

    if (shouldSync) {
      console.log(`Syncing credentials for user: ${username} (Reason: ${!userExists ? 'New User' : passwordChanged ? 'Password Change' : 'Force Sync'})`);
      await db.execute({
        sql: "DELETE FROM admin_users WHERE username = ?",
        args: [username],
      });
      await db.execute({
        sql: "INSERT INTO admin_users (id, username, password_hash, password_text, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [`admin-${crypto.randomUUID()}`, username, hashPassword(password), '', "Administrator", "admin", "active", new Date().toISOString()],
      });
      return { created: !userExists, updated: userExists, skipped: false };
    }
    
    return { created: false, updated: false, skipped: false };
  } catch (error) {
    console.error("Critical error in ensureAdminUser sync:", error);
    return { error, skipped: false };
  }
};

export const upsertConfiguredAdminUser = async (db: ReturnType<typeof createClient>) => {
  await ensureAdminSchema(db);
  const { username, password } = resolveAdminCredentials();
  if (!username || !password) {
    throw new Error("Configured admin credentials are missing.");
  }

  await db.execute("DELETE FROM admin_users");
  const id = `admin-${crypto.randomUUID()}`;
  await db.execute({
    sql: "INSERT INTO admin_users (id, username, password_hash, password_text, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, username, hashPassword(password), '', "Administrator", "admin", "active", new Date().toISOString()],
  });
  return { id, display_name: "Administrator" };
};
