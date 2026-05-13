import { createClient } from "@libsql/client";
import fs from "node:fs";

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

const mode = process.argv.includes("--cable") ? "cable" : "broadband";
const url = mode === "cable"
  ? process.env.VITE_CABLE_TURSO_DATABASE_URL
  : process.env.VITE_BROADBAND_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL;
const authToken = mode === "cable"
  ? process.env.VITE_CABLE_TURSO_AUTH_TOKEN
  : process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error(`Missing ${mode} Turso credentials in .env.`);
}

const db = createClient({ url, authToken });

async function seed() {
  const rawData = fs.readFileSync("./public/import_data.json", "utf8");
  const data = JSON.parse(rawData);
  const subscribers = data.subscribers || [];

  console.log(`Seeding ${mode} database with ${subscribers.length} subscribers...`);
  await db.execute("DELETE FROM subscribers");

  for (let i = 0; i < subscribers.length; i += 50) {
    const batch = subscribers.slice(i, i + 50);
    await db.batch(batch.map((s: any) => ({
      sql: `INSERT INTO subscribers (
        id, code, name, phone, area, customer_id, customer_username, customer_password, email,
        plan_id, status, expiry_date, balance, auto_billing, unpaid_months,
        house_no, landmark, installation_date, opening_balance, customer_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        s.id,
        s.code,
        s.name,
        s.phone || "",
        s.area || "",
        s.customerId || s.stbNumber || "",
        s.customerUsername || "",
        s.customerPassword || "",
        s.email || "",
        s.planId || "p1",
        s.status || "active",
        s.expiryDate || new Date().toISOString(),
        s.balance || 0,
        s.autoBilling ? 1 : 0,
        JSON.stringify(s.unpaidMonths || []),
        s.houseNo || "",
        s.landmark || "",
        s.installationDate || "",
        s.openingBalance || 0,
        s.customerNo || i + 1,
      ],
    })), "write");
    console.log(`Inserted ${Math.min(i + batch.length, subscribers.length)} / ${subscribers.length}`);
  }

  console.log("Seeding completed successfully.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
