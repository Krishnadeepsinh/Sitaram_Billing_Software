import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

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

const configs: Record<BusinessMode, { url?: string; authToken?: string }> = {
  broadband: {
    url: process.env.BROADBAND_TURSO_DATABASE_URL || process.env.VITE_BROADBAND_TURSO_DATABASE_URL,
    authToken: process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN,
  },
  cable: {
    url: process.env.CABLE_TURSO_DATABASE_URL || process.env.VITE_CABLE_TURSO_DATABASE_URL,
    authToken: process.env.CABLE_TURSO_AUTH_TOKEN || process.env.VITE_CABLE_TURSO_AUTH_TOKEN,
  },
};

const tables = [
  "subscribers",
  "payments",
  "invoices",
  "expenses",
  "reminders",
  "agents",
  "plans",
  "company_settings",
];

const args = new Set(process.argv.slice(2));
const modes: BusinessMode[] = args.has("--cable")
  ? ["cable"]
  : args.has("--broadband")
    ? ["broadband"]
    : ["cable", "broadband"];

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(process.cwd(), "backups");
fs.mkdirSync(backupDir, { recursive: true });

const sanitizeRows = (mode: BusinessMode, table: string, rows: any[]) => {
  if (mode === "broadband" && table === "subscribers") {
    return rows.map((row) => ({ ...row, customer_password: "" }));
  }
  return rows;
};

for (const mode of modes) {
  const config = configs[mode];
  if (!config.url || !config.authToken) {
    throw new Error(`Missing Turso config for ${mode}.`);
  }

  const db = createClient({ url: config.url, authToken: config.authToken });
  const snapshot: Record<string, unknown> = {
    businessMode: mode,
    exportedAt: new Date().toISOString(),
    passwordExported: false,
  };

  for (const table of tables) {
    const result = await db.execute(`SELECT * FROM ${table}`);
    snapshot[table] = sanitizeRows(mode, table, result.rows);
  }

  const outPath = path.join(backupDir, `${mode}-backup-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`Saved ${mode} backup to ${outPath}`);
}
