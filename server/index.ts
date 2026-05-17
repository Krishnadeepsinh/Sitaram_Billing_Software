import { createClient } from "@libsql/client";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";

type BusinessMode = "cable" | "broadband";

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

const port = Number(process.env.API_PORT || 8787);
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const sessionTtlMs = 1000 * 60 * 60 * 12;
const scryptAsync = promisify(crypto.scrypt);
const loginAttempts = new Map<string, { count: number; firstAttemptAt: number; blockedUntil?: number }>();
const loginWindowMs = 15 * 60 * 1000;
const maxLoginAttempts = 8;

const configs = {
  broadband: {
    url: process.env.BROADBAND_TURSO_DATABASE_URL || process.env.BROADBAND_TURSO_DATABASE_URL || process.env.BROADBAND_TURSO_DATABASE_URL,
    authToken: process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.BROADBAND_TURSO_AUTH_TOKEN,
  },
  cable: {
    url: process.env.CABLE_TURSO_DATABASE_URL || process.env.CABLE_TURSO_DATABASE_URL,
    authToken: process.env.CABLE_TURSO_AUTH_TOKEN || process.env.CABLE_TURSO_AUTH_TOKEN,
  },
};

const clients = new Map<BusinessMode, ReturnType<typeof createClient>>();

const getDb = (mode: BusinessMode) => {
  const config = configs[mode];
  if (!config.url || !config.authToken) {
    throw new Error(`${mode} database is not configured.`);
  }
  if (!clients.has(mode)) {
    clients.set(mode, createClient({ url: config.url, authToken: config.authToken }));
  }
  return clients.get(mode)!;
};

const readBody = async (req: http.IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
};

const send = (res: http.ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}) => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(data));
};

const parseCookies = (req: http.IncomingMessage) => {
  const cookies: Record<string, string> = {};
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
  }
  return cookies;
};

const sign = (payload: string) =>
  crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");

const createSession = (userId: string) => {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + sessionTtlMs })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const verifySession = (req: http.IncomingMessage) => {
  const token = parseCookies(req).sitaram_session;
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

const requireSession = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const session = verifySession(req);
  if (!session) {
    send(res, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
};

const sanitizeMode = (value: unknown): BusinessMode =>
  value === "cable" ? "cable" : "broadband";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const hashPassword = async (password: string, salt = crypto.randomBytes(16).toString("hex")) => {
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
};

const safeCompare = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

type AdminUserRow = {
  id?: string;
  password_text?: string;
  display_name?: string;
};

const ensureAdminSchema = async (db: ReturnType<typeof createClient>) => {
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

  // Ensure login_attempts table exists for persistent rate limiting
  await db.execute(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL,
      last_attempt_at INTEGER NOT NULL,
      blocked_until INTEGER
    )
  `);

  // Ensure crucial performance indexes exist to prevent full table scans
  try {
    await db.execute("CREATE INDEX IF NOT EXISTS idx_invoices_subscriber_id ON invoices(subscriber_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_payments_subscriber_id ON payments(subscriber_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id)");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_reminders_subscriber_id ON reminders(subscriber_id)");
  } catch (err) {
    console.warn("Index creation warning:", err);
  }
};

const resolveAdminCredentials = () => {
  const username = String(process.env.ADMIN_USERNAME || "").trim() || "adminshakti";
  const password = String(process.env.ADMIN_PASSWORD || "").trim() || "Shaktisinh@22";
  return { username, password };
};

let localAdminSynced = false;

const ensureAdminUser = async (db: ReturnType<typeof createClient>) => {
  if (localAdminSynced) {
    return;
  }

  try {
    await ensureAdminSchema(db);
    const { username, password } = resolveAdminCredentials();

    const existingUser = await db.execute({
      sql: "SELECT id, password_text FROM admin_users WHERE username = ? LIMIT 1",
      args: [username],
    });

    const userRow = existingUser.rows[0];
    const userExists = existingUser.rows.length > 0;
    const storedPassword = userRow ? String(userRow.password_text || "") : "";
    
    const passwordChanged = userExists && storedPassword.trim() !== password.trim();
    const forceSync = String(process.env.SYNC_ADMIN_PASSWORD_ON_BOOT || "").toLowerCase() === "true";
    const shouldSync = !userExists || passwordChanged || forceSync;

    if (shouldSync) {
      console.log(`Syncing credentials for user: ${username} (Reason: ${!userExists ? 'New User' : passwordChanged ? 'Password Change' : 'Force Sync'})`);
      await db.execute({
        sql: "DELETE FROM admin_users WHERE username = ?",
        args: [username],
      });
      await db.execute({
        sql: "INSERT INTO admin_users (id, username, password_text, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [`admin-${crypto.randomUUID()}`, username, password, "Administrator", "admin", "active", new Date().toISOString()],
      });
    }
    localAdminSynced = true;
  } catch (error) {
    console.error("Critical error in ensureAdminUser local sync:", error);
  }
};

const getRequestIp = (req: http.IncomingMessage) =>
  req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
  req.socket.remoteAddress ||
  "unknown";

const getRateLimitState = (key: string) => {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || now - current.firstAttemptAt > loginWindowMs) {
    const next: { count: number; firstAttemptAt: number; blockedUntil?: number } = { count: 0, firstAttemptAt: now };
    loginAttempts.set(key, next);
    return next;
  }
  return current;
};

const isBlocked = (key: string) => {
  const current = loginAttempts.get(key);
  return Boolean(current?.blockedUntil && current.blockedUntil > Date.now());
};

const recordFailedLogin = (key: string) => {
  const current = getRateLimitState(key);
  current.count += 1;
  if (current.count >= maxLoginAttempts) {
    current.blockedUntil = Date.now() + loginWindowMs;
  }
  loginAttempts.set(key, current);
};

const clearFailedLogins = (key: string) => {
  loginAttempts.delete(key);
};

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const serveStatic = async (res: http.ServerResponse, filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return false;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Cache-Control": "public, max-age=31536000",
    });

    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/api/session") {
      const session = verifySession(req);
      send(res, session ? 200 : 401, { authenticated: Boolean(session) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const ipKey = `ip:${getRequestIp(req)}`;
      const userKey = `user:${username.toLowerCase()}`;
      const secureCookieSuffix = process.env.NODE_ENV === "production" ? "; Secure" : "";

      if (isBlocked(ipKey) || isBlocked(userKey)) {
        send(res, 429, { error: "Too many login attempts. Please try again later." });
        return;
      }

      const db = getDb("broadband");
      await ensureAdminUser(db);
      const result = await db.execute({
        sql: "SELECT id, display_name, password_text FROM admin_users WHERE username = ? AND status = 'active' LIMIT 1",
        args: [username],
      });

      if (result.rows.length === 0) {
        recordFailedLogin(ipKey);
        recordFailedLogin(userKey);
        send(res, 401, { error: "Invalid credentials" });
        return;
      }

      const user = result.rows[0] as AdminUserRow & { display_name?: string };
      if (!safeCompare(password, String(user.password_text || ""))) {
        recordFailedLogin(ipKey);
        recordFailedLogin(userKey);
        send(res, 401, { error: "Invalid credentials" });
        return;
      }

      clearFailedLogins(ipKey);
      clearFailedLogins(userKey);

      send(res, 200, { authenticated: true, displayName: user.display_name || "Administrator" }, {
        "Set-Cookie": `sitaram_session=${createSession(String(user.id || ""))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}${secureCookieSuffix}`,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
      send(res, 200, { ok: true }, {
        "Set-Cookie": "sitaram_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/db/execute") {
      if (!requireSession(req, res)) return;
      const body = await readBody(req);
      const db = getDb(sanitizeMode(body.mode));
      const result = typeof body.query === "string"
        ? await db.execute(body.query)
        : await db.execute(body.query);
      send(res, 200, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/db/batch") {
      if (!requireSession(req, res)) return;
      const body = await readBody(req);
      const db = getDb(sanitizeMode(body.mode));
      const result = await db.batch(body.queries || [], body.txMode || "write");
      send(res, 200, result);
      return;
    }

    // Static File Serving (Frontend)
    if (req.method === "GET") {
      const distPath = path.join(process.cwd(), "dist");
      const filePath = path.join(distPath, url.pathname === "/" ? "index.html" : url.pathname);

      if (await serveStatic(res, filePath)) return;

      // SPA Routing: If file not found, serve index.html for React Router
      if (await serveStatic(res, path.join(distPath, "index.html"))) return;
    }

    send(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    send(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Sitaram API server running at http://127.0.0.1:${port}`);
});
