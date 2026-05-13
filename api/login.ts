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
    await ensureAdminUser(db);
    console.log("DB connected. Searching for user:", userTrimmed);
    
    const result = await db.execute({
      sql: "SELECT id, display_name, password_text, password_hash FROM admin_users WHERE username = ? AND status = 'active' LIMIT 1",
      args: [userTrimmed],
    });

    if (result.rows.length === 0) {
      console.log("Login failed: User not found in database.");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0] as LoginUserRow;
    console.log("User found. Verifying password from database...");
    const dbPassword = String(user.password_text || user.password_hash || "");
    const valid = dbPassword === passString;
    
    if (!valid) {
      console.log("Login failed: Password mismatch.");
      return res.status(401).json({ error: "Invalid credentials" });
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
