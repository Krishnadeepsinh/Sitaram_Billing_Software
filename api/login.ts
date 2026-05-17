import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, createSession, sessionTtlMs, ensureAdminUser, readJsonBody, isProduction, verifyPassword } from "./_utils.js";

type LoginUserRow = {
  id?: string;
  display_name?: string;
  password_hash?: string;
  password_text?: string;
};

interface DbRateLimit {
  attempts: number;
  lastAttemptAt: number;
  blockedUntil: number | null;
}

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

const getDbRateLimit = async (db: ReturnType<typeof getDb>, ip: string): Promise<DbRateLimit | null> => {
  try {
    const result = await db.execute({
      sql: "SELECT attempts, last_attempt_at, blocked_until FROM login_attempts WHERE ip = ? LIMIT 1",
      args: [ip],
    });
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      attempts: Number(row.attempts || 0),
      lastAttemptAt: Number(row.last_attempt_at || 0),
      blockedUntil: row.blocked_until ? Number(row.blocked_until) : null,
    };
  } catch (err) {
    console.error("Error reading database rate limit:", err);
    return null;
  }
};

const recordFailedDbLogin = async (db: ReturnType<typeof getDb>, ip: string) => {
  try {
    const now = Date.now();
    const current = await getDbRateLimit(db, ip);
    
    if (!current || now - current.lastAttemptAt > loginWindowMs) {
      await db.execute({
        sql: "INSERT OR REPLACE INTO login_attempts (ip, attempts, last_attempt_at, blocked_until) VALUES (?, 1, ?, NULL)",
        args: [ip, now],
      });
    } else {
      const nextAttempts = current.attempts + 1;
      const blockedUntil = nextAttempts >= maxLoginAttempts ? now + loginWindowMs : null;
      await db.execute({
        sql: "UPDATE login_attempts SET attempts = ?, last_attempt_at = ?, blocked_until = ? WHERE ip = ?",
        args: [nextAttempts, now, blockedUntil, ip],
      });
    }
  } catch (err) {
    console.error("Error writing database rate limit:", err);
  }
};

const clearFailedDbLogins = async (db: ReturnType<typeof getDb>, ip: string) => {
  try {
    await db.execute({
      sql: "DELETE FROM login_attempts WHERE ip = ?",
      args: [ip],
    });
  } catch (err) {
    console.error("Error clearing database rate limit:", err);
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = getRequestIp(req);
  const db = getDb("broadband");

  // Dynamic schema & user boot sync (runs once per warm container boot lifecycle)
  const syncResult = await ensureAdminUser(db);
  if (syncResult && "error" in syncResult) {
    console.warn("Database sync encountered an issue, but attempting login anyway...");
  }

  // Check persistent rate limit state
  const rateLimit = await getDbRateLimit(db, ip);
  if (rateLimit && rateLimit.blockedUntil && rateLimit.blockedUntil > Date.now()) {
    return res.status(429).json({ error: "Too many login attempts. Please try again in 15 minutes." });
  }

  try {
    const body = await readJsonBody<{ username?: string; password?: string }>(req);
    const userTrimmed = String(body.username || "").trim();
    const passString = String(body.password || "");

    console.log("Database connected. Searching for user:", userTrimmed);
    
    const result = await db.execute({
      sql: "SELECT id, display_name, password_text, password_hash FROM admin_users WHERE username = ? AND status = 'active' LIMIT 1",
      args: [userTrimmed],
    });

    if (result.rows.length === 0) {
      console.log(`Login attempt failed: User '${userTrimmed}' not found or inactive.`);
      await recordFailedDbLogin(db, ip);
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
      await recordFailedDbLogin(db, ip);
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
      return res.status(401).json({ error: "Invalid username or password." });
    }

    console.log("Login successful for:", userTrimmed);
    await clearFailedDbLogins(db, ip);

    const session = createSession(String(user.id));
    res.setHeader("Set-Cookie", `sitaram_session=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}${isProduction ? "; Secure" : ""}`);
    return res.status(200).json({ authenticated: true, displayName: user.display_name || "Administrator" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
}
