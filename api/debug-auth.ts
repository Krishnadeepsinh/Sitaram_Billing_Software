import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  return res.status(200).json({
    ok: true,
    version: "debug-auth-v1",
    hasAdminUsername: Boolean(String(process.env.ADMIN_USERNAME || "").trim()),
    hasAdminPassword: Boolean(String(process.env.ADMIN_PASSWORD || "").trim()),
    hasAdminPasswordHash: Boolean(String(process.env.ADMIN_PASSWORD_HASH || "").trim()),
    hasBroadbandDbUrl: Boolean(String(process.env.BROADBAND_TURSO_DATABASE_URL || "").trim()),
    hasBroadbandDbToken: Boolean(String(process.env.BROADBAND_TURSO_AUTH_TOKEN || "").trim()),
    syncAdminPasswordOnBoot: String(process.env.SYNC_ADMIN_PASSWORD_ON_BOOT || "").trim().toLowerCase() === "true",
    vercelEnv: String(process.env.VERCEL_ENV || ""),
  });
}
