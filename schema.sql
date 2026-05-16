-- Turso/SQLite Schema for Sitaram Broadband Billing Software

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT NOT NULL, -- customer address
  customer_id TEXT NOT NULL,
  customer_username TEXT,
  customer_password TEXT,
  email TEXT,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  expiry_date TEXT,
  balance REAL DEFAULT 0,
  auto_billing INTEGER DEFAULT 1,
  unpaid_months TEXT, -- JSON array as string
  house_no TEXT,
  landmark TEXT,
  installation_date TEXT,
  opening_balance REAL DEFAULT 0,
  customer_no TEXT
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  validity_days INTEGER NOT NULL,
  speed_mbps INTEGER NOT NULL,
  price_without_gst REAL,
  provider_plan_id TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  agent TEXT NOT NULL,
  date TEXT NOT NULL,
  discount REAL DEFAULT 0,
  invoice_id TEXT,
  balance_at_payment REAL,
  created_at TEXT,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT UNIQUE,
  subscriber_id TEXT NOT NULL,
  amount REAL NOT NULL,
  gst_amount REAL NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  type TEXT,
  billing_period TEXT,
  discount REAL DEFAULT 0,
  service_start TEXT,
  service_end TEXT,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  areas TEXT, -- JSON array as string
  status TEXT DEFAULT 'active',
  join_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  sent_at TEXT,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'admin',
  status TEXT DEFAULT 'active',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY,
  name TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  upi_id TEXT
);

INSERT OR IGNORE INTO company_settings (id, name, address, phone, email, gstin, upi_id)
VALUES (1, 'SITARAM CABLE & BROADBAND', 'Chitra, Bhavnagar 364004', '9825039825', '', '', '9825039825@ybl');
