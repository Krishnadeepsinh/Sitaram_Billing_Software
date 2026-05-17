import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, createSession, sessionTtlMs, ensureAdminUser, readJsonBody, isProduction, verifyPassword } from "./_utils.js";

type LoginUserRow = {
  id?: string;
  display_name?: string;
  password_hash?: string;
  password_text?: string;
};

interface RateLimit {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimit>();
const loginWindowMs = 15 * 60 * 1000; // 15 minutes
const maxLoginAttempts = 5;

const getRequestIp = (req: VercelRequest): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    if (Array.isArray(forwarded)) return forwarded[0].trim();
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "127.0.0.1";
};

const getRateLimitState = (key: string): RateLimit => {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || now - current.firstAttemptAt > loginWindowMs) {
    const next = { count: 0, firstAttemptAt: now };
    loginAttempts.set(key, next);
    return next;
  }
  return current;
};

const isBlocked = (key: string): boolean => {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ipKey = `ip:${getRequestIp(req)}`;

  if (isBlocked(ipKey)) {
    return res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
  }

  try {
    const body = await readJsonBody<{ username?: string; password?: string }>(req);
    const userTrimmed = String(body.username || "").trim();
    const passString = String(body.password || "");

    const db = getDb("broadband");
    const syncResult = await ensureAdminUser(db);
    if (syncResult && "error" in syncResult) {
      console.warn("Database sync encountered an issue, but attempting login anyway...");
    }
    
    console.log("Database connected. Searching for user:", userTrimmed);
    
    const result = await db.execute({
      sql: "SELECT id, display_name, password_text, password_hash FROM admin_users WHERE username = ? AND status = 'active' LIMIT 1",
      args: [userTrimmed],
    });

    if (result.rows.length === 0) {
      console.log(`Login attempt failed: User '${userTrimmed}' not found or inactive.`);
      recordFailedLogin(ipKey);
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0] as LoginUserRow;
    const dbHash = String(user.password_hash || "");
    
    let valid = false;
    if (dbHash.includes(":")) {
      valid = verifyPassword(passString, dbHash);
    } else {
      // Fallback for legacy plaintext during transition
      const dbPassword = String(user.password_text || user.password_hash || "");
      valid = dbPassword === passString;
    }
    
    if (!valid) {
      console.log(`Login attempt failed: Password mismatch for user '${userTrimmed}'.`);
      recordFailedLogin(ipKey);
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
      return res.status(401).json({ error: "Invalid username or password." });
    }

    console.log("Login successful for:", userTrimmed);
    clearFailedLogins(ipKey);

    const session = createSession(String(user.id));
    res.setHeader("Set-Cookie", `sitaram_session=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}${isProduction ? "; Secure" : ""}`);
    return res.status(200).json({ authenticated: true, displayName: user.display_name || "Administrator" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
}
