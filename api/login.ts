import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, verifyPassword, hashPassword, createSession, sessionTtlMs } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const { username, password } = req.body;
  const userTrimmed = String(username || "").trim();
  const passString = String(password || "");

  try {
    const db = getDb("broadband");
    const result = await db.execute({
      sql: "SELECT id, display_name, password_hash FROM admin_users WHERE username = ? AND status = 'active' LIMIT 1",
      args: [userTrimmed],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0] as any;
    const verification = await verifyPassword(passString, String(user.password_hash || ""));
    
    if (!verification.valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (verification.needsUpgrade) {
      await db.execute({
        sql: "UPDATE admin_users SET password_hash = ? WHERE id = ?",
        args: [await hashPassword(passString), String(user.id)],
      });
    }

    const session = createSession(String(user.id));
    res.setHeader("Set-Cookie", `sitaram_session=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}`);
    return res.status(200).json({ authenticated: true, displayName: user.display_name || "Administrator" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
