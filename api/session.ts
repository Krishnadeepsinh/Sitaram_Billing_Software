import { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySession } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  
  const session = verifySession(req);
  return res.status(session ? 200 : 401).json({ authenticated: Boolean(session) });
}
