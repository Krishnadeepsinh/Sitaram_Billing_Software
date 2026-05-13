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
