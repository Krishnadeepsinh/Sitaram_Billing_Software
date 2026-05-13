import { createClient } from "@libsql/client";
import crypto from "node:crypto";
import { VercelRequest, VercelResponse } from "@vercel/node";

export type BusinessMode = "cable" | "broadband";

const sessionSecret = process.env.SESSION_SECRET || "fallback-secret-for-dev-only";
export const sessionTtlMs = 1000 * 60 * 60 * 12;

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
  return createClient({ url: config.url, authToken: config.authToken });
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

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const scryptAsync = (password: string, salt: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
};

export const hashPassword = async (password: string, salt = crypto.randomBytes(16).toString("hex")) => {
  const derived = await scryptAsync(password, salt);
  return `scrypt$${salt}$${derived.toString("hex")}`;
};

export const safeCompare = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export const verifyPassword = async (password: string, storedHash: string) => {
  if (!storedHash) return { valid: false, needsUpgrade: false };

  if (storedHash.startsWith("scrypt$")) {
    const [, salt, expected] = storedHash.split("$");
    if (!salt || !expected) return { valid: false, needsUpgrade: false };
    const derived = await scryptAsync(password, salt);
    return { valid: safeCompare(derived.toString("hex"), expected), needsUpgrade: false };
  }

  const legacyHash = storedHash.startsWith("sha256$") ? storedHash.slice("sha256$".length) : storedHash;
  const valid = safeCompare(sha256(password), legacyHash);
  return { valid, needsUpgrade: valid };
};

type AdminUserRow = {
  id?: string;
  password_hash?: string;
  display_name?: string;
};

export const ensureAdminSchema = async (db: ReturnType<typeof createClient>) => {
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
};

const resolveAdminCredentials = () => {
  const username = String(process.env.ADMIN_USERNAME || "admin").trim();
  const plainPassword = String(process.env.ADMIN_PASSWORD || "").trim();
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();
  return { username, plainPassword, passwordHash };
};

export const ensureAdminUser = async (db: ReturnType<typeof createClient>) => {
  await ensureAdminSchema(db);
  const { username, plainPassword, passwordHash: configuredHash } = resolveAdminCredentials();

  if (!username || (!plainPassword && !configuredHash)) {
    return { created: false, updated: false, skipped: true };
  }

  const existingUser = await db.execute({
    sql: "SELECT id, password_hash FROM admin_users WHERE username = ? LIMIT 1",
    args: [username],
  });

  if (existingUser.rows.length === 0) {
    const passwordHash = plainPassword ? await hashPassword(plainPassword) : configuredHash;
    await db.execute({
      sql: "INSERT INTO admin_users (id, username, password_hash, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        `admin-${crypto.randomUUID()}`,
        username,
        passwordHash,
        "Administrator",
        "admin",
        "active",
        new Date().toISOString(),
      ],
    });
    return { created: true, updated: false, skipped: false };
  }

  if (String(process.env.SYNC_ADMIN_PASSWORD_ON_BOOT || "").toLowerCase() === "true") {
    const currentUser = existingUser.rows[0] as AdminUserRow;
    const currentHash = String(currentUser.password_hash || "");
    const verification = plainPassword
      ? await verifyPassword(plainPassword, currentHash)
      : { valid: currentHash === configuredHash, needsUpgrade: false };

    if (!verification.valid || verification.needsUpgrade) {
      const nextHash = plainPassword ? await hashPassword(plainPassword) : configuredHash;
      await db.execute({
        sql: "UPDATE admin_users SET password_hash = ?, status = 'active' WHERE id = ?",
        args: [nextHash, String(currentUser.id || "")],
      });
      return { created: false, updated: true, skipped: false };
    }
  }

  return { created: false, updated: false, skipped: false };
};

export const verifyConfiguredAdminLogin = async (username: string, password: string) => {
  const { username: configuredUsername, plainPassword, passwordHash } = resolveAdminCredentials();
  if (!configuredUsername || username !== configuredUsername) return false;

  if (plainPassword) {
    return safeCompare(password, plainPassword);
  }

  if (passwordHash) {
    const verification = await verifyPassword(password, passwordHash);
    return verification.valid;
  }

  return false;
};

export const upsertConfiguredAdminUser = async (db: ReturnType<typeof createClient>) => {
  await ensureAdminSchema(db);
  const { username, plainPassword, passwordHash: configuredHash } = resolveAdminCredentials();
  if (!username || (!plainPassword && !configuredHash)) {
    throw new Error("Configured admin credentials are missing.");
  }

  const nextHash = plainPassword ? await hashPassword(plainPassword) : configuredHash;
  const existingUser = await db.execute({
    sql: "SELECT id, display_name FROM admin_users WHERE username = ? LIMIT 1",
    args: [username],
  });

  if (existingUser.rows.length === 0) {
    const id = `admin-${crypto.randomUUID()}`;
    await db.execute({
      sql: "INSERT INTO admin_users (id, username, password_hash, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, username, nextHash, "Administrator", "admin", "active", new Date().toISOString()],
    });
    return { id, display_name: "Administrator" };
  }

  const currentUser = existingUser.rows[0] as AdminUserRow;
  const id = String(currentUser.id || "");
  await db.execute({
    sql: "UPDATE admin_users SET password_hash = ?, status = 'active' WHERE id = ?",
    args: [nextHash, id],
  });
  return { id, display_name: currentUser.display_name || "Administrator" };
};
