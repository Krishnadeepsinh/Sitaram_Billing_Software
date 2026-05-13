import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb, verifySession, readJsonBody } from "../_utils.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  const session = verifySession(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { mode, query } = await readJsonBody<{ mode?: string; query?: string | { sql: string; args?: unknown[] } }>(req);
  const db = getDb(mode === "cable" ? "cable" : "broadband");

  try {
    const result = await db.execute(query);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Database error" });
  }
}
