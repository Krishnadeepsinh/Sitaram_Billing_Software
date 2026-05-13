import { createClient } from "@libsql/client";
import fs from "node:fs";

const loadEnv = () => {
  if (!fs.existsSync(".env")) return;
  const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length && !process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  }
};

loadEnv();

const configs = [
  {
    mode: "Broadband",
    companyName: "SITARAM BROADBAND",
    url: process.env.BROADBAND_TURSO_DATABASE_URL || process.env.VITE_BROADBAND_TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL,
    authToken: process.env.BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_BROADBAND_TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN,
    plans: [
      ["p1", "30 Mbps Unlimited", 399, 30, 30],
      ["p2", "50 Mbps Unlimited", 499, 30, 50],
      ["p3", "100 Mbps Unlimited", 699, 30, 100],
      ["p4", "150 Mbps Unlimited", 999, 30, 150],
    ],
  },
  {
    mode: "Cable",
    companyName: "SITARAM CABLE",
    url: process.env.CABLE_TURSO_DATABASE_URL || process.env.VITE_CABLE_TURSO_DATABASE_URL,
    authToken: process.env.CABLE_TURSO_AUTH_TOKEN || process.env.VITE_CABLE_TURSO_AUTH_TOKEN,
    plans: [
      ["p1", "Basic Pack", 200, 30, 100],
      ["p2", "Standard HD", 350, 30, 180],
      ["p3", "Premium Sports", 550, 30, 250],
      ["p4", "Family Combo", 450, 30, 220],
    ],
  },
].filter((config) => config.url && config.authToken);

if (configs.length === 0) {
  throw new Error("Set Turso database URLs and auth tokens in .env first.");
}

async function init(config: typeof configs[number]) {
  console.log(`Initializing ${config.mode} Turso tables...`);
  const db = createClient({ url: config.url!, authToken: config.authToken! });

  await db.batch([
    `CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      area TEXT,
      customer_id TEXT,
      customer_username TEXT,
      customer_password TEXT,
      email TEXT,
      plan_id TEXT,
      status TEXT DEFAULT 'active',
      expiry_date TEXT,
      balance REAL DEFAULT 0,
      auto_billing INTEGER DEFAULT 1,
      unpaid_months TEXT DEFAULT '[]',
      house_no TEXT,
      landmark TEXT,
      installation_date TEXT,
      opening_balance REAL DEFAULT 0,
      customer_no INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      validity_days INTEGER NOT NULL,
      speed_mbps INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      subscriber_id TEXT,
      amount REAL,
      method TEXT,
      agent TEXT,
      date TEXT,
      discount REAL DEFAULT 0,
      invoice_id TEXT,
      balance_at_payment REAL,
      created_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE,
      subscriber_id TEXT,
      amount REAL,
      gst_amount REAL DEFAULT 0,
      date TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      type TEXT DEFAULT 'plan',
      billing_period TEXT,
      discount REAL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT,
      description TEXT,
      amount REAL,
      date TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      areas TEXT DEFAULT '[]',
      status TEXT,
      join_date TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      subscriber_id TEXT,
      type TEXT,
      channel TEXT,
      status TEXT,
      scheduled_at TEXT,
      sent_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY,
      name TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      upi_id TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_text TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'admin',
      status TEXT DEFAULT 'active',
      created_at TEXT
    )`,
    "CREATE INDEX IF NOT EXISTS idx_subscribers_customer_id ON subscribers(customer_id)",
    "CREATE INDEX IF NOT EXISTS idx_subscribers_customer_username ON subscribers(customer_username)",
    "CREATE INDEX IF NOT EXISTS idx_subscribers_customer_no ON subscribers(customer_no)",
    "CREATE INDEX IF NOT EXISTS idx_payments_subscriber_id ON payments(subscriber_id)",
    "CREATE INDEX IF NOT EXISTS idx_invoices_subscriber_id ON invoices(subscriber_id)",
    "CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)",
  ]);

  const migrations = [
    "ALTER TABLE subscribers ADD COLUMN customer_id TEXT",
    "ALTER TABLE subscribers ADD COLUMN customer_username TEXT",
    "ALTER TABLE subscribers ADD COLUMN customer_password TEXT",
    "ALTER TABLE subscribers ADD COLUMN email TEXT",
    "ALTER TABLE subscribers ADD COLUMN house_no TEXT",
    "ALTER TABLE subscribers ADD COLUMN landmark TEXT",
    "ALTER TABLE subscribers ADD COLUMN installation_date TEXT",
    "ALTER TABLE subscribers ADD COLUMN opening_balance REAL DEFAULT 0",
    "ALTER TABLE subscribers ADD COLUMN customer_no INTEGER",
    "ALTER TABLE plans ADD COLUMN speed_mbps INTEGER",
    "ALTER TABLE payments ADD COLUMN discount REAL DEFAULT 0",
    "ALTER TABLE payments ADD COLUMN invoice_id TEXT",
    "ALTER TABLE payments ADD COLUMN balance_at_payment REAL",
    "ALTER TABLE payments ADD COLUMN created_at TEXT",
    "ALTER TABLE invoices ADD COLUMN type TEXT DEFAULT 'plan'",
    "ALTER TABLE invoices ADD COLUMN billing_period TEXT",
    "ALTER TABLE invoices ADD COLUMN discount REAL DEFAULT 0",
  ];

  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists.
    }
  }

  const settings = await db.execute("SELECT COUNT(*) AS count FROM company_settings");
  if (Number(settings.rows[0]?.count || 0) === 0) {
    await db.execute({
      sql: "INSERT INTO company_settings (id, name, address, phone, email, gstin, upi_id) VALUES (1, ?, ?, ?, ?, ?, ?)",
      args: [ config.companyName, "", "", "", "", "" ],
    });
  }

  const plans = await db.execute("SELECT COUNT(*) AS count FROM plans");
  if (Number(plans.rows[0]?.count || 0) === 0) {
    await db.batch([
      ...config.plans.map((plan) => ({
        sql: "INSERT INTO plans (id, name, price, validity_days, speed_mbps) VALUES (?, ?, ?, ?, ?)",
        args: plan,
      })),
    ]);
  }

  const users = await db.execute("SELECT COUNT(*) AS count FROM admin_users");
  if (Number(users.rows[0]?.count || 0) === 0) {
    const username = process.env.ADMIN_USERNAME || "adminshakti";
    const passwordText = process.env.ADMIN_PASSWORD || "Shaktisinh@22";
    if (!passwordText) {
      throw new Error("Set ADMIN_PASSWORD in .env to seed the admin user.");
    }
    await db.execute({
      sql: "INSERT INTO admin_users (id, username, password_text, display_name, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        "admin-1",
        username,
        passwordText,
        "Administrator",
        "admin",
        "active",
        new Date().toISOString(),
      ],
    });
  }

  console.log(`${config.mode} database initialized successfully.`);
}

Promise.all(configs.map((config) => init(config))).catch((error) => {
  console.error(error);
  process.exit(1);
});
