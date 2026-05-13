import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, createSession, sessionTtlMs, ensureAdminUser, readJsonBody } from "./_utils";

type LoginUserRow = {
  id?: string;
  display_name?: string;
  password_hash?: string;
  password_text?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = await readJsonBody<{ username?: string; password?: string }>(req);
    const userTrimmed = String(body.username || "").trim();
    const passString = String(body.password || "");
    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

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
      return res.status(401).json({ error: "Invalid username or account inactive." });
    }

    const user = result.rows[0] as LoginUserRow;
    const dbPassword = String(user.password_text || user.password_hash || "");
    
    // Use simple comparison for now to avoid any timingSafeEqual issues in serverless
    const valid = dbPassword.trim() === passString.trim();
    
    if (!valid) {
      console.log(`Login attempt failed: Password mismatch for user '${userTrimmed}'.`);
      return res.status(401).json({ error: "Invalid password. Please try again." });
    }

    console.log("Login successful for:", userTrimmed);

    const session = createSession(String(user.id));
    res.setHeader("Set-Cookie", `sitaram_session=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}${isProduction ? "; Secure" : ""}`);
    return res.status(200).json({ authenticated: true, displayName: user.display_name || "Administrator" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
}
