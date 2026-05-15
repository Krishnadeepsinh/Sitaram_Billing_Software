import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Subscriber,
  Payment,
  Invoice,
  Expense,
  Reminder,
  plans,
  getDefaultPlans,
  CompanySettings,
  Agent,
  formatMonthRanges,
} from '@/lib/mockData';
import { BusinessMode, db, useBusinessMode } from '@/lib/turso';
import { BRAND_ADDRESS, BRAND_EMAIL, BRAND_NAME, BRAND_PHONE, BRAND_UPI, cleanBrandValue } from '@/lib/branding';

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS = {
  get: <T,>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  },
};

// ── Context type ──────────────────────────────────────────────────────────────
const mapRow = (cols: string[], r: any) => {
  const obj: any = {};
  cols.forEach((c, i) => { obj[c] = r[c] !== undefined ? r[c] : r[i]; });
  return obj;
};

const normalizeBillingDate = (input?: Date) => {
  const billingDate = input ? new Date(input) : new Date();
  billingDate.setHours(12, 0, 0, 0);
  return billingDate;
};

const createInvoiceDueDate = (billingDate: Date) => {
  const dueDate = new Date(billingDate);
  dueDate.setDate(dueDate.getDate() + 7);
  dueDate.setHours(12, 0, 0, 0);
  return dueDate;
};

const createServiceEndDate = (serviceStartDate: Date, validityDays: number) => {
  const serviceEndDate = new Date(serviceStartDate);
  serviceEndDate.setDate(serviceEndDate.getDate() + Math.max(1, Number(validityDays || 30)) - 1);
  serviceEndDate.setHours(12, 0, 0, 0);
  return serviceEndDate;
};

const formatServicePeriod = (serviceStartDate: Date, serviceEndDate: Date) => {
  const formatParts = (value: Date) =>
    value.toLocaleString('default', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  return `${formatParts(serviceStartDate)} TO ${formatParts(serviceEndDate)}`;
};

const normalizeComparable = (value: string | undefined) => String(value || "").trim().toLowerCase();

const validateSubscriberInput = ({
  candidate,
  subscribers,
  editingId,
  businessMode,
}: {
  candidate: Partial<Subscriber>;
  subscribers: Subscriber[];
  editingId?: string;
  businessMode: BusinessMode;
}) => {
  const name = String(candidate.name || "").trim();
  const phone = String(candidate.phone || "").trim();
  const planId = String(candidate.planId || "").trim();
  const customerId = String(candidate.customerId || "").trim();
  const username = String(candidate.customerUsername || "").trim();

  if (!name) throw new Error("Customer name is required.");
  if (!/^\d{10}$/.test(phone)) throw new Error("Mobile number must be exactly 10 digits.");
  if (!planId) throw new Error("Please select a plan.");
  if (!customerId) throw new Error(businessMode === "cable" ? "STB number is required." : "Customer ID is required.");

  const duplicateCustomerId = subscribers.find((sub) => sub.id !== editingId && normalizeComparable(sub.customerId) === normalizeComparable(customerId));
  if (duplicateCustomerId) {
    throw new Error(businessMode === "cable" ? "This STB number already exists." : "This customer ID already exists.");
  }

  if (businessMode === "broadband") {
    if (!username) throw new Error("Customer username is required for broadband subscribers.");
    const duplicateUsername = subscribers.find((sub) => sub.id !== editingId && normalizeComparable(sub.customerUsername) === normalizeComparable(username));
    if (duplicateUsername) throw new Error("This customer username already exists.");
  }
};

interface BillingContextType {
  subscribers: Subscriber[];
  agents: Agent[];
  plans: typeof plans;
  payments: Payment[];
  invoices: Invoice[];
  expenses: Expense[];
  reminders: Reminder[];
  isLoading: boolean;
  addSubscriber: (sub: Omit<Subscriber, 'id' | 'code'>) => Promise<Subscriber>;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => Promise<void>;
  deleteSubscriber: (id: string) => Promise<void>;
  addPlan: (plan: Omit<typeof plans[0], 'id'>) => Promise<void>;
  updatePlan: (id: string, updates: Partial<typeof plans[0]>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  generateInvoice: (subId: string, months?: number | string[], skipFetch?: boolean, customDate?: Date, includePreviousDue?: boolean, subObj?: Subscriber, discount?: number) => Promise<void>;
  deleteInvoice: (id: string, skipFetch?: boolean) => Promise<void>;
  runBulkBilling: (startDate?: Date, numMonths?: number, includePreviousDue?: boolean) => Promise<void>;
  bulkDeleteInvoices: (ids: string[]) => Promise<void>;
  recordPayment: (payment: Omit<Payment, 'id'> & { invoiceId?: string, discount?: number }) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  stats: {
    collectedToday: number;
    monthRevenue: number;
    monthExpenses: number;
    pendingDues: number;
    expiringCount: number;
    totalSubscribers: number;
    active: number;
    expired: number;
  };
  dashboardDate: Date;
  setDashboardDate: (date: Date) => void;
  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  refreshData: () => Promise<void>;
  runAutoLegacyBilling: () => Promise<void>;
  recalculateBalances: () => Promise<boolean>;
  importBackupData: (data: any) => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const businessMode = useBusinessMode();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [agents, setAgents]           = useState<Agent[]>([]);
  const [plansList, setPlansList]     = useState<typeof plans>([]);
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [invoices, setInvoices]       = useState<Invoice[]>([]);
  const [expenses, setExpenses]       = useState<Expense[]>([]);
  const [reminders, setReminders]     = useState<Reminder[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: BRAND_NAME,
    address: BRAND_ADDRESS,
    phone: BRAND_PHONE,
    email: BRAND_EMAIL,
    gstin: '',
    upiId: BRAND_UPI,
  });
  const [isLoading, setIsLoading]     = useState(true);
  const [dashboardDate, setDashboardDate] = useState(new Date());

  // ── Fetch: Turso DB ─────────────────────────────────────────────────────────
  const fetchFromDB = useCallback(async () => {
    if (!db) return false;
    try {
      const schemaMigrated = LS.get(`schema_migrated_v2_${businessMode}`, false);
      
      if (!schemaMigrated) {
        // Initialize tables if they don't exist
        await db.batch([
          'CREATE TABLE IF NOT EXISTS subscribers (id TEXT PRIMARY KEY, code TEXT, name TEXT, phone TEXT, area TEXT, customer_id TEXT, customer_username TEXT, customer_password TEXT, email TEXT, plan_id TEXT, status TEXT, expiry_date TEXT, balance REAL, auto_billing INTEGER, unpaid_months TEXT, house_no TEXT, landmark TEXT, installation_date TEXT, opening_balance REAL, customer_no INTEGER)',
          'CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, name TEXT, price REAL, validity_days INTEGER, speed_mbps INTEGER, price_without_gst REAL, provider_plan_id TEXT, category TEXT)',
          'CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, subscriber_id TEXT, amount REAL, method TEXT, agent TEXT, date TEXT, discount REAL, invoice_id TEXT, balance_at_payment REAL, created_at TEXT)',
          'CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, number TEXT, subscriber_id TEXT, amount REAL, gst_amount REAL, date TEXT, due_date TEXT, status TEXT, type TEXT, billing_period TEXT, discount REAL)',
          'CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, category TEXT, description TEXT, amount REAL, date TEXT)',
          'CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, subscriber_id TEXT, type TEXT, channel TEXT, status TEXT, scheduled_at TEXT, sent_at TEXT)',
          'CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, name TEXT, phone TEXT, areas TEXT, status TEXT, join_date TEXT)',
          'CREATE TABLE IF NOT EXISTS company_settings (id INTEGER PRIMARY KEY, name TEXT, address TEXT, phone TEXT, email TEXT, gstin TEXT, upi_id TEXT)',
        ]);
  
        // Ensure invoice_id exists in payments if table was already created
        try {
          await db.execute("ALTER TABLE payments ADD COLUMN invoice_id TEXT");
        } catch (e) { /* ignore if already exists */ }
  
        // Handle migration for existing subscribers table
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN house_no TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN landmark TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN installation_date TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN opening_balance REAL'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN customer_no INTEGER'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN customer_id TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN customer_username TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN customer_password TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE subscribers ADD COLUMN email TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE plans ADD COLUMN speed_mbps INTEGER'); } catch(e) {}
        try { await db.execute('ALTER TABLE plans ADD COLUMN price_without_gst REAL'); } catch(e) {}
        try { await db.execute('ALTER TABLE plans ADD COLUMN provider_plan_id TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE plans ADD COLUMN category TEXT'); } catch(e) {}
        
        // Backfill customer_no for existing subscribers
        const missingNoCheck = await db.execute('SELECT id FROM subscribers WHERE customer_no IS NULL OR customer_no = 0 ORDER BY installation_date ASC, name ASC');
        if (missingNoCheck.rows.length > 0) {
          const maxNoRes = await db.execute('SELECT MAX(customer_no) as maxNo FROM subscribers');
          // Handle both array and object row formats from libSQL
          let currentMax = Number(maxNoRes.rows[0][0] || maxNoRes.rows[0].maxNo || 0);
          
          const updates = missingNoCheck.rows.map(row => {
            currentMax++;
            const id = row[0] || row.id;
            return { sql: 'UPDATE subscribers SET customer_no = ? WHERE id = ?', args: [currentMax, String(id)] };
          });
          if (updates.length > 0) await db.batch(updates);
        }
        
        try { await db.execute('ALTER TABLE invoices ADD COLUMN type TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE invoices ADD COLUMN billing_period TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE invoices ADD COLUMN discount REAL'); } catch(e) {}
        try { await db.execute('ALTER TABLE payments ADD COLUMN discount REAL'); } catch(e) {}
        try { await db.execute('ALTER TABLE payments ADD COLUMN invoice_id TEXT'); } catch(e) {}
        try { await db.execute('ALTER TABLE payments ADD COLUMN balance_at_payment REAL'); } catch(e) {}
        try { await db.execute('ALTER TABLE payments ADD COLUMN created_at TEXT'); } catch(e) {}
  
        // Default company settings
        const companyCheck = await db.execute('SELECT COUNT(*) as count FROM company_settings');
        if (Number(companyCheck.rows[0].count) === 0) {
          await db.execute({
            sql: 'INSERT INTO company_settings (id, name, address, phone, email, gstin, upi_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [1, BRAND_NAME, BRAND_ADDRESS, BRAND_PHONE, BRAND_EMAIL, '', BRAND_UPI]
          });
        } else {
          const existingSettings = await db.execute('SELECT * FROM company_settings WHERE id = 1');
          const current = existingSettings.rows[0] ? mapRow(existingSettings.columns, existingSettings.rows[0]) : null;
          const shouldMigrateLegacyDefaults =
            current &&
            (
              cleanBrandValue(current.address, '') === 'Ahmedabad, Gujarat' ||
              cleanBrandValue(current.phone, '') === '98260 33825' ||
              cleanBrandValue(current.email, '') === 'info@sitaramcablebroadband.com' ||
              cleanBrandValue(current.upi_id, '') === 'pay@upi' ||
              cleanBrandValue(current.gstin, '') === 'GST-CR-998877'
            );
  
          if (shouldMigrateLegacyDefaults) {
            await db.execute({
              sql: 'UPDATE company_settings SET name = ?, address = ?, phone = ?, email = ?, gstin = ?, upi_id = ? WHERE id = 1',
              args: [BRAND_NAME, BRAND_ADDRESS, BRAND_PHONE, BRAND_EMAIL, '', BRAND_UPI],
            });
          }
        }
  
        // Seed plans ONLY once if empty
        const planCheck = await db.execute('SELECT COUNT(*) as count FROM plans');
        const plansSeeded = LS.get(`plans_seeded_${businessMode}`, false);
        
        if (Number(planCheck.rows[0].count) === 0 && !plansSeeded) {
          const initialPlans = getDefaultPlans(businessMode);
          const planInserts = initialPlans.map(p => ({
            sql: 'INSERT INTO plans (id, name, price, validity_days, speed_mbps, price_without_gst, provider_plan_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            args: [p.id, p.name, p.price, p.validityDays, p.speedMbps, p.priceWithoutGst || p.price, p.providerPlanId || '', p.category || 'welcome']
          }));
          await db.batch(planInserts);
          LS.set(`plans_seeded_${businessMode}`, true);
        } else if (businessMode === "broadband") {
          const existingPlansRes = await db.execute('SELECT provider_plan_id FROM plans');
          const existingPlanIds = new Set(
            existingPlansRes.rows
              .map((row: any) => String(row.provider_plan_id || row.providerPlanId || row[0] || "").trim())
              .filter(Boolean)
          );
          const missingBroadbandPlans = getDefaultPlans("broadband").filter(
            (plan) => plan.providerPlanId && !existingPlanIds.has(plan.providerPlanId)
          );
  
          if (missingBroadbandPlans.length > 0) {
            const planInserts = missingBroadbandPlans.map(p => ({
              sql: 'INSERT INTO plans (id, name, price, validity_days, speed_mbps, price_without_gst, provider_plan_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              args: [p.id, p.name, p.price, p.validityDays, p.speedMbps, p.priceWithoutGst || p.price, p.providerPlanId || '', p.category || 'welcome']
            }));
            await db.batch(planInserts);
          }
        }
  
        // Add indexes for performance optimization
        await db.batch([
          'CREATE INDEX IF NOT EXISTS idx_subs_status ON subscribers(status)',
          'CREATE INDEX IF NOT EXISTS idx_subs_area ON subscribers(area)',
          'CREATE INDEX IF NOT EXISTS idx_pay_subid ON payments(subscriber_id)',
          'CREATE INDEX IF NOT EXISTS idx_pay_date ON payments(date)',
          'CREATE INDEX IF NOT EXISTS idx_inv_subid ON invoices(subscriber_id)',
          'CREATE INDEX IF NOT EXISTS idx_inv_date ON invoices(date)',
          'CREATE INDEX IF NOT EXISTS idx_inv_status ON invoices(status)',
        ]);

        LS.set(`schema_migrated_v2_${businessMode}`, true);
      }

      const results = await db.batch([
        'SELECT * FROM subscribers ORDER BY name ASC',
        'SELECT * FROM payments ORDER BY date DESC',
        'SELECT * FROM invoices ORDER BY date DESC',
        'SELECT * FROM expenses ORDER BY date DESC',
        'SELECT * FROM reminders ORDER BY scheduled_at DESC',
        'SELECT * FROM plans',
        'SELECT * FROM company_settings WHERE id = 1',
        'SELECT * FROM agents ORDER BY name ASC',
      ]);

      const [subsRes, payRes, invRes, expRes, remRes, planRes, companyRes, agentRes] = results;

      console.log(`Fetched ${subsRes.rows.length} subscribers from DB`);
      setSubscribers(subsRes.rows.map(row => {
        const r = mapRow(subsRes.columns, row);
        return {
          id: r.id,
          code: r.code,
          name: r.name,
          phone: r.phone,
          area: r.area,
          status: r.status,
          balance: Number(r.balance || 0),
          autoBilling: r.auto_billing === 1,
          customerId: r.customer_id || r.stb_number || '',
          customerUsername: r.customer_username || '',
          customerPassword: r.customer_password || '',
          email: r.email || '',
          planId: r.plan_id,
          expiryDate: r.expiry_date,
          unpaidMonths: JSON.parse(String(r.unpaid_months || '[]')),
          houseNo: r.house_no,
          landmark: r.landmark,
          installationDate: r.installation_date,
          openingBalance: Number(r.opening_balance || 0),
          customerNo: Number(r.customer_no || 0),
        } as unknown as Subscriber;
      }));

      setPayments(payRes.rows.map(row => {
        const r = mapRow(payRes.columns, row);
        return { 
          id: r.id, 
          amount: r.amount, 
          method: r.method, 
          agent: r.agent, 
          date: r.date, 
          subscriberId: r.subscriber_id,
          discount: Number(r.discount || 0),
          invoiceId: r.invoice_id
        } as unknown as Payment;
      }));
      setInvoices(invRes.rows.map(row => {
        const r = mapRow(invRes.columns, row);
        return { 
          id: r.id, 
          number: r.number, 
          amount: r.amount, 
          date: r.date, 
          status: r.status, 
          subscriberId: r.subscriber_id, 
          dueDate: r.due_date, 
          gstAmount: r.gst_amount, 
          type: r.type || 'plan',
          billingPeriod: r.billing_period,
          discount: Number(r.discount || 0)
        } as unknown as Invoice;
      }));
      setExpenses(expRes.rows.map(row => {
        const r = mapRow(expRes.columns, row);
        return { id: r.id, category: r.category, description: r.description, amount: r.amount, date: r.date } as unknown as Expense;
      }));
      setReminders(remRes.rows.map(row => {
        const r = mapRow(remRes.columns, row);
        return { id: r.id, type: r.type, channel: r.channel, status: r.status, sentAt: r.sent_at, subscriberId: r.subscriber_id, scheduledAt: r.scheduled_at } as unknown as Reminder;
      }));
      setPlansList(planRes.rows.map(row => {
        const r = mapRow(planRes.columns, row);
        return {
          id: r.id,
          name: r.name,
          price: Number(r.price || 0),
          speedMbps: Number(r.speed_mbps || r.speedMbps || r.channels || 0),
          validityDays: Number(r.valid_days || r.validity_days || 30),
          priceWithoutGst: Number(r.price_without_gst || r.priceWithoutGst || r.price || 0),
          providerPlanId: String(r.provider_plan_id || r.providerPlanId || ""),
          category: (r.category || "welcome") as any,
        } as unknown as any;
      }));
      setAgents(agentRes.rows.map(row => {
        const r = mapRow(agentRes.columns, row);
        return {
          id: r.id,
          name: r.name,
          phone: r.phone,
          status: r.status,
          areas: JSON.parse(String(r.areas || '[]')),
          joinDate: r.join_date
        } as unknown as Agent;
      }));
      
      if (companyRes.rows[0]) {
        const c = companyRes.rows[0];
        setCompanySettings({
          name: cleanBrandValue(c.name, BRAND_NAME),
          address: cleanBrandValue(c.address, BRAND_ADDRESS),
          phone: cleanBrandValue(c.phone, BRAND_PHONE),
          email: cleanBrandValue(c.email, BRAND_EMAIL),
          gstin: cleanBrandValue(c.gstin, ''),
          upiId: cleanBrandValue(c.upi_id, BRAND_UPI)
        });
      }

      return true;
    } catch (err) {
      console.error('Turso fetch error:', err);
      return false;
    }
  }, [businessMode]);

  // ── Fetch: localStorage ─────────────────────────────────────────────────────
  const fetchFromLS = useCallback(() => {
    setSubscribers(LS.get<Subscriber[]>('subscribers', []));
    setPayments(LS.get<Payment[]>('payments', []));
    setInvoices(LS.get<Invoice[]>('invoices', []));
    setExpenses(LS.get<Expense[]>('expenses', []));
    setReminders(LS.get<Reminder[]>('reminders', []));
    setPlansList(LS.get<typeof plans>('plans', getDefaultPlans(businessMode)));
    setCompanySettings({
      name: BRAND_NAME,
      address: BRAND_ADDRESS,
      phone: BRAND_PHONE,
      email: BRAND_EMAIL,
      gstin: '',
      upiId: BRAND_UPI,
    });
  }, [businessMode]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (db) {
        const ok = await fetchFromDB();
        if (!ok) fetchFromLS();
      } else {
        fetchFromLS();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData();
  }, [businessMode]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const generateSequentialId = (prefix: string, list: any[], key: string) => {
    // Escape special characters for regex
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`);
    let max = 0;
    list.forEach(item => {
      const val = String(item[key] || '');
      const match = val.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return `${prefix}${String(max + 1).padStart(2, '0')}`;
  };

  // ── Mutations ────────────────────────────────────────────────────────────────
  const addSubscriber = async (newSubData: Omit<Subscriber, 'id' | 'code'>): Promise<Subscriber> => {
    validateSubscriberInput({ candidate: newSubData, subscribers, businessMode });
    const id = Math.random().toString(36).substr(2, 9);
    const code = `SUB-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const customerNo = subscribers.length > 0 ? Math.max(...subscribers.map(s => s.customerNo || 0)) + 1 : 1;
    
    // Ensure balance reflects opening balance as debt
    const initialBalance = (Number(newSubData.balance) || 0) - (Number(newSubData.openingBalance) || 0);
    const newSub: Subscriber = { id, code, customerNo, ...newSubData, balance: initialBalance };
    
    if (db) {
      try {
        const expiryDate = newSubData.expiryDate || "";
        await db.execute({
          sql: 'INSERT INTO subscribers (id, code, name, phone, area, customer_id, customer_username, customer_password, email, plan_id, status, expiry_date, balance, auto_billing, unpaid_months, house_no, landmark, installation_date, opening_balance, customer_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            id, code, newSubData.name, newSubData.phone, newSubData.area,
            newSubData.customerId, newSubData.customerUsername || '', newSubData.customerPassword || '', newSubData.email || '',
            newSubData.planId, newSubData.status,
            expiryDate, initialBalance,
            newSubData.autoBilling ? 1 : 0, JSON.stringify(newSubData.unpaidMonths || []),
            newSubData.houseNo || '', newSubData.landmark || '', newSubData.installationDate || '',
            newSubData.openingBalance || 0, customerNo
          ],
        });
        await fetchData();
      } catch (err) { 
        console.error('addSubscriber DB error:', err); 
        throw err;
      }
    } else {
      const updated = [...subscribers, newSub];
      setSubscribers(updated);
      LS.set('subscribers', updated);
    }
    return newSub;
  };

  const updateSubscriber = async (id: string, updates: Partial<Subscriber>) => {
    const existingSub = subscribers.find((sub) => sub.id === id);
    if (!existingSub) throw new Error('Subscriber not found.');
    
    // Skip full validation if only status is being updated to avoid blocking toggles on legacy records
    const isStatusOnly = Object.keys(updates).length === 1 && updates.status !== undefined;
    if (!isStatusOnly) {
      validateSubscriberInput({ candidate: { ...existingSub, ...updates }, subscribers, editingId: id, businessMode });
    }

    if (db) {
      console.log('Updating subscriber (DB):', id, updates);
      
      try {
        const mapped: any = {};
        if (updates.name !== undefined) mapped.name = updates.name;
        if (updates.phone !== undefined) mapped.phone = updates.phone;
        if (updates.area !== undefined) mapped.area = updates.area;
        if (updates.customerId !== undefined) mapped.customer_id = updates.customerId;
        if (updates.customerUsername !== undefined) mapped.customer_username = updates.customerUsername;
        if (updates.customerPassword !== undefined) mapped.customer_password = updates.customerPassword;
        if (updates.email !== undefined) mapped.email = updates.email;
        if (updates.planId !== undefined) mapped.plan_id = updates.planId;
        if (updates.status !== undefined) mapped.status = updates.status;
        if (updates.expiryDate !== undefined) mapped.expiry_date = updates.expiryDate;
        if (updates.balance !== undefined) mapped.balance = updates.balance;
        if (updates.autoBilling !== undefined) mapped.auto_billing = updates.autoBilling ? 1 : 0;
        if (updates.unpaidMonths !== undefined) mapped.unpaid_months = JSON.stringify(updates.unpaidMonths);
        if (updates.houseNo !== undefined) mapped.house_no = updates.houseNo;
        if (updates.landmark !== undefined) mapped.landmark = updates.landmark;
        if (updates.installationDate !== undefined) mapped.installation_date = updates.installationDate;
        if (updates.openingBalance !== undefined) mapped.opening_balance = updates.openingBalance;
        if (updates.customerNo !== undefined) mapped.customer_no = updates.customerNo;

        if (Object.keys(mapped).length === 0) return;

        const fields = Object.keys(mapped).map(k => `${k} = ?`).join(', ');
        const targetId = String(id || "").trim();
        
        await db.execute({ 
          sql: `UPDATE subscribers SET ${fields} WHERE id = ?`, 
          args: [...Object.values(mapped), targetId] 
        });
        
        console.log('Updating subscriber (Local):', id, updates);
        
        // Update local state AFTER DB success as requested
        setSubscribers(prev => prev.map(s => {
          const sId = String(s.id || "").trim().toLowerCase();
          return sId === targetId ? { ...s, ...updates } : s;
        }));

        // Optimization: For simple status toggles, skip the full refresh to prevent flickering
        if (Object.keys(updates).length === 1 && updates.status) {
          console.log('Status update only, skipping full refresh');
        } else {
          console.log('Refreshing all data for consistency...');
          await fetchData(); 
        }
      } catch (err) { 
        console.error('updateSubscriber DB error:', err);
        throw err;
      }
    } else {
      console.log('Updating subscriber (Local):', id, updates);
      const updated = subscribers.map(s => {
        const sId = String(s.id || "").trim().toLowerCase();
        const targetId = String(id || "").trim().toLowerCase();
        return sId === targetId ? { ...s, ...updates } : s;
      });
      setSubscribers(updated);
      LS.set('subscribers', updated);
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (db) {
      try {
        await db.batch([
          { sql: 'DELETE FROM subscribers WHERE id = ?', args: [id] },
          { sql: 'DELETE FROM invoices WHERE subscriber_id = ?', args: [id] },
          { sql: 'DELETE FROM payments WHERE subscriber_id = ?', args: [id] }
        ]);
      } catch (err) { 
        console.error('deleteSubscriber DB error:', err);
        throw err;
      }
      await fetchData();
    } else {
      const updated = subscribers.filter(s => s.id !== id);
      setSubscribers(updated);
      LS.set('subscribers', updated);
      
      const updatedInv = invoices.filter(i => i.subscriberId !== id);
      setInvoices(updatedInv);
      LS.set('invoices', updatedInv);

      const updatedPay = payments.filter(p => p.subscriberId !== id);
      setPayments(updatedPay);
      LS.set('payments', updatedPay);
    }
  };

  const addPlan = async (pData: Omit<typeof plans[0], 'id'>) => {
    const id = `p${Math.random().toString(36).substr(2, 5)}`;
    if (db) {
      try {
        await db.execute({
          sql: 'INSERT INTO plans (id, name, price, validity_days, speed_mbps, price_without_gst, provider_plan_id, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          args: [id, pData.name, pData.price, pData.validityDays, pData.speedMbps, pData.priceWithoutGst || pData.price, pData.providerPlanId || '', pData.category || 'welcome'],
        });
      } catch (err) { console.error('addPlan DB error:', err); }
      await fetchData();
    } else {
      const updated = [...plansList, { id, ...pData }];
      setPlansList(updated);
      LS.set('plans', updated);
    }
  };

  const updatePlan = async (id: string, updates: Partial<typeof plans[0]>) => {
    if (db) {
      try {
        const allowedKeys = ['name', 'price', 'validityDays', 'speedMbps', 'priceWithoutGst', 'providerPlanId', 'category'];
        const mapped: Record<string, any> = {};
        for (const k of allowedKeys) {
          if ((updates as any)[k] !== undefined) mapped[k] = (updates as any)[k];
        }
        if (Object.keys(mapped).length === 0) return;
        const setClause = Object.keys(mapped)
          .map(k =>
            k === 'validityDays' ? 'validity_days = ?' :
            k === 'speedMbps' ? 'speed_mbps = ?' :
            k === 'priceWithoutGst' ? 'price_without_gst = ?' :
            k === 'providerPlanId' ? 'provider_plan_id = ?' :
            `${k} = ?`
          )
          .join(', ');
        await db.execute({
          sql: `UPDATE plans SET ${setClause} WHERE id = ?`,
          args: [...Object.values(mapped), id],
        });
      } catch (err) { console.error('updatePlan DB error:', err); }
      await fetchData();
    } else {
      const updated = plansList.map(p => p.id === id ? { ...p, ...updates } : p);
      setPlansList(updated);
      LS.set('plans', updated);
    }
  };

  const deletePlan = async (id: string) => {
    if (db) {
      try {
        await db.execute({ sql: 'DELETE FROM plans WHERE id = ?', args: [id] });
      } catch (err) { console.error('deletePlan DB error:', err); }
      await fetchData();
    } else {
      const updated = plansList.filter(p => p.id !== id);
      setPlansList(updated);
      LS.set('plans', updated);
    }
  };

  const recordPayment = async (pData: Omit<Payment, 'id'> & { invoiceId?: string, discount?: number }): Promise<Payment> => {
    const id = generateSequentialId('#SCN-PAY-', payments, 'id');
    const amount = Number(pData.amount);
    const discount = Number(pData.discount || 0);
    const createdAt = new Date().toISOString();
    const newPayment: Payment = { ...pData, id, amount, discount, createdAt };

    if (db) {
      try {
        const sub = subscribers.find(s => s.id === pData.subscriberId);
        if (sub) {
          const plan = plansList.find(pl => pl.id === sub.planId);
          const currentBalance = Number(sub.balance) || 0;
          const newBalance = currentBalance + amount + discount;
          
          let updatedMonths = [...(sub.unpaidMonths || [])];
          if (plan && plan.price > 0) {
            if (newBalance >= -0.01) {
              updatedMonths = [];
            } else {
              const monthsOwed = Math.ceil(Math.abs(newBalance) / plan.price);
              while (updatedMonths.length > monthsOwed) {
                updatedMonths.shift(); // Remove oldest months first
              }
            }
          }

          const batch: any[] = [
            {
              sql: 'INSERT INTO payments (id, subscriber_id, amount, method, agent, date, discount, invoice_id, balance_at_payment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              args: [id, pData.subscriberId, amount, pData.method, pData.agent, pData.date, discount, pData.invoiceId || null, newBalance, createdAt],
            },
            {
              sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ? WHERE id = ?',
              args: [newBalance, JSON.stringify(updatedMonths), sub.id]
            }
          ];

          if (pData.invoiceId && discount > 0) {
            batch.push({
              sql: 'UPDATE invoices SET amount = amount - ?, discount = COALESCE(discount, 0) + ? WHERE id = ?',
              args: [discount, discount, pData.invoiceId]
            });
          }

          // Mark invoices as paid based on custom priority:
          // 1. Specifically selected invoice (if any)
          // 2. Legacy invoices
          // 3. Plan invoices (chronological)
          const subInvoicesRes = await db.execute({ 
            sql: `SELECT id, amount, status, type, discount FROM invoices WHERE subscriber_id = ? 
                  ORDER BY 
                    CASE WHEN id = ? THEN 0 WHEN type = 'legacy' THEN 1 ELSE 2 END, 
                    date ASC`, 
            args: [sub.id, pData.invoiceId || 'NONE'] 
          });
          const subInvoices = subInvoicesRes.rows.map(r => mapRow(subInvoicesRes.columns, r));

          // Manually adjust the specific invoice in memory if it was updated in this call
          if (pData.invoiceId && discount > 0) {
            subInvoices.forEach(inv => {
              if (String(inv.id) === pData.invoiceId) {
                inv.amount = Number(inv.amount) - discount;
                inv.discount = (Number(inv.discount) || 0) + discount;
              }
            });
          }

          const totalInvoiced = subInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
          // totalPaid is the absolute sum of all money ever received
          const totalPaid = newBalance + totalInvoiced + (Number(sub.openingBalance) || 0);
          
          let covered = totalPaid;
          // IMPORTANT: Opening balance (if not yet converted to legacy invoice) must be subtracted from covered
          // to ensure it takes priority over current month invoices.
          // However, if legacy invoices EXIST, they already represent the opening balance.
          // The runLegacyBulkBilling logic sets openingBalance to 0 when creating legacy invoices.
          const currentOpeningBal = Number(sub.openingBalance) || 0;
          covered -= currentOpeningBal;

          for (const inv of subInvoices) {
            const invAmount = Number(inv.amount || 0);
            if (covered >= invAmount - 0.01) {
              if (inv.status !== 'paid') {
                batch.push({ sql: "UPDATE invoices SET status = 'paid' WHERE id = ?", args: [String(inv.id)] });
              }
              covered -= invAmount;
            } else {
              if (inv.status === 'paid') {
                batch.push({ sql: "UPDATE invoices SET status = 'pending' WHERE id = ?", args: [String(inv.id)] });
              }
              covered -= invAmount; // Keep reducing to track deficit correctly
            }
          }

          await db.batch(batch);
        }
      } catch (err) { 
        console.error('recordPayment DB error:', err);
        throw err;
      }
      await fetchData();
      return newPayment;
    } else {
      const updatedPayments = [...payments, newPayment];
      setPayments(updatedPayments);
      LS.set('payments', updatedPayments);

      const sub = subscribers.find(s => s.id === pData.subscriberId);
      if (sub) {
        const plan = plansList.find(pl => pl.id === sub.planId);
        const newBalance = (Number(sub.balance) || 0) + amount + discount;
        let updatedMonths = [...(sub.unpaidMonths || [])];
        
        if (plan && plan.price > 0) {
          if (newBalance >= -0.01) {
            updatedMonths = [];
          } else {
            const monthsOwed = Math.ceil(Math.abs(newBalance) / plan.price);
            while (updatedMonths.length > monthsOwed) {
              updatedMonths.shift();
            }
          }
        }
        
        let currentInvoices = invoices.map(inv => {
          if (inv.id === pData.invoiceId && discount > 0) {
            return { ...inv, amount: inv.amount - discount, discount: (inv.discount || 0) + discount };
          }
          return inv;
        });

        const updatedSubs = subscribers.map(s => 
          s.id === sub.id ? { ...s, balance: newBalance, unpaidMonths: updatedMonths } : s
        );
        setSubscribers(updatedSubs);
        LS.set('subscribers', updatedSubs);

        // Sync statuses with custom priority:
        // 1. Specific target invoice
        // 2. Legacy invoices
        // 3. Plan invoices (chronological)
        const subInvoices = currentInvoices
          .filter(inv => inv.subscriberId === sub.id)
          .sort((a, b) => {
            if (a.id === pData.invoiceId) return -1;
            if (b.id === pData.invoiceId) return 1;
            const typeA = a.type === 'legacy' ? 0 : 1;
            const typeB = b.type === 'legacy' ? 0 : 1;
            if (typeA !== typeB) return typeA - typeB;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
        
        const totalInvoiced = subInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
        const totalPaid = newBalance + totalInvoiced + (Number(sub.openingBalance) || 0);
        
        let covered = totalPaid;
        const finalInvoices = currentInvoices.map(inv => {
          if (inv.subscriberId !== sub.id) return inv;
          // Find this invoice in sorted subInvoices to maintain consistency
          const sortedInv = subInvoices.find(si => si.id === inv.id);
          if (!sortedInv) return inv;

          const invAmount = Number(inv.amount || 0);
          if (covered >= invAmount - 0.01) {
            covered -= invAmount;
            return { ...inv, status: 'paid' as const };
          } else {
            return { ...inv, status: 'pending' as const };
          }
        });
        setInvoices(finalInvoices);
        LS.set('invoices', finalInvoices);
      }
      return newPayment;
    }
  };

  const deletePayment = async (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    if (db) {
      try {
        const sub = subscribers.find(s => s.id === payment.subscriberId);
        if (sub) {
          const amount = Number(payment.amount);
          const currentBalance = Number(sub.balance) || 0;
          const newBalance = currentBalance - amount;
          
          const plan = plansList.find(p => p.id === sub.planId);
          let updatedMonths = [...(sub.unpaidMonths || [])];
          
          // Reconstruct unpaid months if balance becomes negative and list was empty
          if (plan && plan.price > 0 && newBalance < -0.01) {
            const monthsOwed = Math.ceil(Math.abs(newBalance) / plan.price);
            if (updatedMonths.length === 0) {
              const start = new Date(payment.date);
              for (let i = 0; i < monthsOwed; i++) {
                const d = new Date(start);
                d.setMonth(d.getMonth() - i);
                const mName = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!updatedMonths.includes(mName)) updatedMonths.unshift(mName);
              }
            }
          }

          const batch: any[] = [
            { sql: 'DELETE FROM payments WHERE id = ?', args: [id] },
            { sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ? WHERE id = ?', args: [newBalance, JSON.stringify(updatedMonths), sub.id] }
          ];

          // Restore discount to invoice if applicable
          if (payment.invoiceId && Number(payment.discount || 0) > 0) {
            batch.push({
              sql: 'UPDATE invoices SET amount = amount + ?, discount = CASE WHEN discount <= ? THEN 0 ELSE discount - ? END WHERE id = ?',
              args: [Number(payment.discount), Number(payment.discount), Number(payment.discount), payment.invoiceId]
            });
          }

          // Sync statuses chronologically (Legacy first)
          const subInvoicesRes = await db.execute({ 
            sql: "SELECT id, amount, status, type, discount FROM invoices WHERE subscriber_id = ? ORDER BY CASE WHEN type = 'legacy' THEN 0 ELSE 1 END, date ASC", 
            args: [sub.id]
          });
          
          const subInvoices = subInvoicesRes.rows.map(r => mapRow(subInvoicesRes.columns, r));
          const totalInvoiced = subInvoices.reduce((s, i) => {
            let amt = Number(i.amount || 0);
            if (payment.invoiceId && String(i.id) === payment.invoiceId) amt += Number(payment.discount || 0);
            return s + amt;
          }, 0);
          const totalPaid = newBalance + totalInvoiced + (Number(sub.openingBalance) || 0);
          
          let covered = totalPaid;
          for (const inv of subInvoices) {
            let invAmount = Number(inv.amount || 0);
            if (payment.invoiceId && String(inv.id) === payment.invoiceId) invAmount += Number(payment.discount || 0);
            
            if (covered >= invAmount - 0.01) {
              if (inv.status !== 'paid') {
                batch.push({ sql: "UPDATE invoices SET status = 'paid' WHERE id = ?", args: [String(inv.id)] });
              }
              covered -= invAmount;
            } else {
              if (inv.status === 'paid') {
                batch.push({ sql: "UPDATE invoices SET status = 'pending' WHERE id = ?", args: [String(inv.id)] });
              }
            }
          }

          await db.batch(batch);
        } else {
          await db.execute({ sql: 'DELETE FROM payments WHERE id = ?', args: [id] });
        }
      } catch (err) { 
        console.error('deletePayment DB error:', err);
        throw err; // Throw so UI can catch and show error toast
      }
      await fetchData();
    } else {
      const sub = subscribers.find(s => s.id === payment.subscriberId);
      const updatedPayments = payments.filter(p => p.id !== id);
      setPayments(updatedPayments);
      LS.set('payments', updatedPayments);

      if (sub) {
        const amount = Number(payment.amount);
        const newBalance = (Number(sub.balance) || 0) - amount;
        const plan = plansList.find(p => p.id === sub.planId);
        let updatedMonths = [...(sub.unpaidMonths || [])];
        
        if (plan && plan.price > 0 && newBalance < -0.01 && updatedMonths.length === 0) {
          const monthsOwed = Math.ceil(Math.abs(newBalance) / plan.price);
          const start = new Date(payment.date);
          for (let i = 0; i < monthsOwed; i++) {
            const d = new Date(start);
            d.setMonth(d.getMonth() - i);
            updatedMonths.unshift(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
          }
        }

        const updatedSubs = subscribers.map(s => 
          s.id === sub.id ? { ...s, balance: newBalance, unpaidMonths: updatedMonths } : s
        );
        setSubscribers(updatedSubs);
        LS.set('subscribers', updatedSubs);
        // Restore discount if applicable
        let currentInvoices = invoices.map(inv => {
          if (inv.id === payment.invoiceId && Number(payment.discount || 0) > 0) {
            return { ...inv, amount: inv.amount + Number(payment.discount), discount: Math.max(0, (inv.discount || 0) - Number(payment.discount)) };
          }
          return inv;
        });

        // Sync statuses chronologically (Legacy first)
        const subInvoices = currentInvoices
          .filter(inv => inv.subscriberId === sub.id)
          .sort((a, b) => {
            const typeA = a.type === 'legacy' ? 0 : 1;
            const typeB = b.type === 'legacy' ? 0 : 1;
            if (typeA !== typeB) return typeA - typeB;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
        
        const totalInvoiced = subInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
        const totalPaid = newBalance + totalInvoiced + (Number(sub.openingBalance) || 0);
        
        let covered = totalPaid;
        const updatedInvoices = currentInvoices.map(inv => {
          if (inv.subscriberId !== sub.id) return inv;
          const invAmount = Number(inv.amount || 0);
          if (covered >= invAmount - 0.01) {
            covered -= invAmount;
            return { ...inv, status: 'paid' as const };
          } else {
            return { ...inv, status: 'pending' as const };
          }
        });
        setInvoices(updatedInvoices);
        LS.set('invoices', updatedInvoices);
      }
    }
  };

  const generateInvoice = async (subId: string, months: number | string[] = 1, skipFetch = false, customDate?: Date, includePreviousDue = false, subObj?: Subscriber, discount = 0) => {
    let sub = subObj || subscribers.find(s => s.id === subId);
    
    // Fallback for race conditions (e.g. adding subscriber then immediately generating invoice)
    if (!sub && db) {
      try {
        const res = await db.execute({
          sql: 'SELECT * FROM subscribers WHERE id = ?',
          args: [subId]
        });
        if (res.rows[0]) {
          const r = mapRow(res.columns, res.rows[0]);
          sub = {
            id: String(r.id),
            code: String(r.code),
            name: String(r.name),
            phone: String(r.phone),
            area: String(r.area),
            customerId: String(r.customer_id || r.stb_number || ''),
            customerUsername: String(r.customer_username || ''),
            customerPassword: String(r.customer_password || ''),
            email: String(r.email || ''),
            planId: String(r.plan_id),
            status: String(r.status),
            expiryDate: String(r.expiry_date),
            balance: Number(r.balance),
            autoBilling: Number(r.auto_billing) === 1,
            unpaidMonths: JSON.parse(String(r.unpaid_months || '[]')),
            houseNo: String(r.house_no || ''),
            landmark: String(r.landmark || ''),
            installationDate: String(r.installation_date || ''),
            openingBalance: Number(r.opening_balance || 0),
          } as Subscriber;
        }
      } catch (err) {
        console.error('generateInvoice DB fallback error:', err);
      }
    }

    if (!sub) throw new Error('Subscriber not found');
    
    const numMonths = Array.isArray(months) ? months.length : months;
    const isLegacy = numMonths === 0;

    if (!isLegacy && sub.status !== 'active') {
      throw new Error('Cannot generate regular plan invoice for inactive subscriber');
    }
    
    const plan = plansList.find(p => p.id === sub.planId);
    if (!plan) throw new Error('Plan not found for this subscriber');

    const id = `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const number = generateSequentialId('#SCN-IN-', invoices, 'number');
    const billingDate = normalizeBillingDate(customDate);
    const date = billingDate.toISOString();
    const dueDate = createInvoiceDueDate(billingDate).toISOString();
    
    if (numMonths === 0 && !includePreviousDue) return;

    const prevDue = includePreviousDue ? (sub.openingBalance || 0) : 0;
    // If includePreviousDue is true and numMonths is 0, we are generating a separate legacy invoice
    // If numMonths > 0 and includePreviousDue is true, we might still be mixing them (but user wants them separate)
    // To enforce separation, we'll assume if numMonths > 0, we don't include legacy due UNLESS explicitly requested.
    // Actually, to follow the user request "generate separately", we'll make it so if numMonths > 0, prevDue is 0.
    
    const isManualPlanCycle = numMonths > 0 && !Array.isArray(months);
    const serviceStartDate = billingDate;
    const serviceEndDate = createServiceEndDate(
      serviceStartDate,
      isManualPlanCycle ? Number(plan.validityDays || 30) * numMonths : numMonths * 30
    );
    const finalPlanCharge = numMonths > 0 ? (plan.price * numMonths) : 0;
    const finalPriceWithoutGst = numMonths > 0 ? (plan.priceWithoutGst || plan.price) * numMonths : 0;
    const finalPrevDue = numMonths === 0 ? prevDue : 0; // Only include legacy if months is 0
    
    const total = (finalPlanCharge + finalPrevDue) - discount;
    const gst = numMonths > 0 ? (finalPlanCharge - finalPriceWithoutGst) : 0;

    const newExpiryDate = numMonths > 0 
      ? serviceEndDate.toISOString()
      : sub.expiryDate;

    const selectedMonthNames = numMonths > 0 
      ? (Array.isArray(months) 
          ? months 
          : isManualPlanCycle
          ? [`${serviceStartDate.toISOString().slice(0, 10)}::${numMonths}`]
          : Array.from({ length: months }).map((_, i) => {
              const d = new Date(billingDate);
              d.setMonth(d.getMonth() + i);
              return d.toLocaleString('default', { month: 'long', year: 'numeric' });
            }))
      : ["Previous Year Billing"];

    const billingPeriod = numMonths > 0 
      ? (() => {
          if (Array.isArray(months)) {
            const dateObjects = months.map(m => new Date(m));
            return formatMonthRanges(dateObjects).toUpperCase();
          } else if (isManualPlanCycle) {
            return formatServicePeriod(serviceStartDate, serviceEndDate);
          } else {
            const dateObjects = Array.from({ length: months }).map((_, i) => {
              const d = new Date(billingDate);
              d.setMonth(d.getMonth() + i);
              return d;
            });
            return formatMonthRanges(dateObjects).toUpperCase();
          }
        })()
      : 'PREVIOUS YEAR';

    // Check for existing invoices for these months or legacy type
    const hasExisting = invoices.some(inv => {
      if (inv.subscriberId !== subId) return false;
      if (numMonths === 0) {
        return inv.type === 'legacy';
      }
      if (isManualPlanCycle) {
        return inv.type !== 'legacy'
          && new Date(inv.date).toISOString().slice(0, 10) === serviceStartDate.toISOString().slice(0, 10)
          && String(inv.billingPeriod || '') === billingPeriod;
      }
      return inv.type !== 'legacy' && selectedMonthNames.some(mName => 
        new Date(new Date(inv.date).getTime() + 12 * 60 * 60 * 1000).toLocaleString('default', { month: 'long', year: 'numeric' }) === mName
      );
    });

    if (hasExisting) {
      console.warn('Invoice already exists for one or more selected months');
      return null;
    }

    const invType = numMonths === 0 ? 'legacy' : 'plan';

    if (db) {
      try {
        // If we are formalizing legacy dues, the debt is already in sub.balance.
        // We only subtract the NEW charges (plan charges) and ignore the part that is just moving legacy debt.
        const planChargeInInvoice = numMonths === 0 ? 0 : Number(plan?.price || 0) * numMonths;
        const newBalance = (Number(sub.balance) || 0) - (planChargeInInvoice - Number(discount || 0));
        const isPaid = newBalance >= 0;
        
        let updatedMonths = [...sub.unpaidMonths];
        for (const mName of selectedMonthNames) {
          if (!isPaid && !updatedMonths.includes(mName)) {
            updatedMonths.push(mName);
          }
        }

        await db.batch([
          {
            sql: 'INSERT INTO invoices (id, number, subscriber_id, amount, gst_amount, date, due_date, status, type, billing_period, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            args: [id, number, subId, total, gst, date, dueDate, isPaid ? 'paid' : 'pending', invType, billingPeriod, discount]
          },
          {
            sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ?, expiry_date = ?, opening_balance = ? WHERE id = ?',
            args: [
              newBalance, 
              JSON.stringify(updatedMonths), 
              newExpiryDate, 
              includePreviousDue ? 0 : (sub.openingBalance || 0),
              subId
            ]
          }
        ]);
        
        // Final Truth Sync: Ensure all invoices (including previous ones) are correctly marked based on total payment history
        await recalculateBalances(subId);
      } catch (err) { console.error('generateInvoice DB error:', err); }
      if (!skipFetch) await fetchData();
    } else {
      const newBalance = (sub.balance || 0) - total;
      const isPaid = newBalance >= 0;
      
      const newInv: Invoice = {
        id,
        number,
        subscriberId: subId,
        amount: total,
        gstAmount: gst,
        date,
        dueDate,
        status: isPaid ? 'paid' : 'pending',
        type: invType,
        billingPeriod,
        discount
      };

      const updatedInvoices = [newInv, ...invoices];
      setInvoices(updatedInvoices);
      LS.set('invoices', updatedInvoices);

      let updatedMonths = [...sub.unpaidMonths];
      for (const mName of selectedMonthNames) {
        if (!isPaid && !updatedMonths.includes(mName)) {
          updatedMonths.push(mName);
        }
      }

      const updatedSubs = subscribers.map(s => 
        s.id === subId ? { 
          ...s, 
          balance: newBalance, 
          unpaidMonths: updatedMonths, 
          expiryDate: newExpiryDate,
          openingBalance: includePreviousDue ? 0 : (s.openingBalance || 0)
        } : s
      );
      setSubscribers(updatedSubs);
      LS.set('subscribers', updatedSubs);
    }
  };

  const deleteInvoice = async (id: string, skipFetch = false) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    // Find matching payment if any
    const matchingPayments = payments.filter(p => p.subscriberId === inv.subscriberId && Number(p.amount) === Number(inv.amount));
    matchingPayments.sort((a, b) => Math.abs(new Date(a.date).getTime() - new Date(inv.date).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(inv.date).getTime()));
    const paymentToDelete = matchingPayments.length > 0 && Math.abs(new Date(matchingPayments[0].date).getTime() - new Date(inv.date).getTime()) < 35 * 24 * 60 * 60 * 1000 ? matchingPayments[0] : null;
    
    if (db) {
      try {
        // Re-fetch fresh balance directly from DB to avoid stale state
        const subRow = await db.execute({ sql: 'SELECT * FROM subscribers WHERE id = ?', args: [inv.subscriberId] });
        if (subRow.rows[0]) {
          const obj = mapRow(subRow.columns, subRow.rows[0]);
          const currentBalance = Number(obj.balance || 0);
          let newBalance = currentBalance + Number(inv.amount);
          
          if (paymentToDelete) {
            newBalance -= Number(paymentToDelete.amount);
          }

          // Only keep unpaid months if balance is still negative
          let updatedMonths: string[] = [];
          if (newBalance < 0) {
            const existing = JSON.parse(String(subRow.rows[0].unpaid_months || '[]')) as string[];
            if (existing.length > 0) updatedMonths = existing.slice(0, -1);
          }

          // If deleting a legacy invoice, restore the opening_balance that was zeroed on generation
          const restoredOpeningBalance = inv.type === 'legacy'
            ? Number(subRow.rows[0].opening_balance || 0) + Number(inv.amount)
            : Number(subRow.rows[0].opening_balance || 0);

          const batch: any[] = [
            { sql: 'DELETE FROM invoices WHERE id = ?', args: [id] },
            { sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ?, opening_balance = ? WHERE id = ?', args: [newBalance, JSON.stringify(updatedMonths), restoredOpeningBalance, inv.subscriberId] }
          ];
          
          if (paymentToDelete) {
            batch.push({ sql: 'DELETE FROM payments WHERE id = ?', args: [paymentToDelete.id] });
          }

          // Sync statuses chronologically (Legacy first) for REMAINING invoices
          const subInvoicesRes = await db.execute({ 
            sql: "SELECT id, amount, status, type FROM invoices WHERE subscriber_id = ? AND id != ? ORDER BY CASE WHEN type = 'legacy' THEN 0 ELSE 1 END, date ASC", 
            args: [inv.subscriberId, inv.id] 
          });
          const subInvoices = subInvoicesRes.rows;
          const totalInvoiced = subInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
          const totalPaid = newBalance + totalInvoiced + (restoredOpeningBalance);
          
          let covered = totalPaid;
          for (const remInv of subInvoices) {
            const invAmount = Number(remInv.amount || 0);
            if (covered >= invAmount - 0.01) {
              if (remInv.status !== 'paid') {
                batch.push({ sql: "UPDATE invoices SET status = 'paid' WHERE id = ?", args: [String(remInv.id)] });
              }
              covered -= invAmount;
            } else {
              if (remInv.status === 'paid') {
                batch.push({ sql: "UPDATE invoices SET status = 'pending' WHERE id = ?", args: [String(remInv.id)] });
              }
            }
          }

          await db.batch(batch);
        } else {
          const batch: any[] = [{ sql: 'DELETE FROM invoices WHERE id = ?', args: [id] }];
          if (paymentToDelete) batch.push({ sql: 'DELETE FROM payments WHERE id = ?', args: [paymentToDelete.id] });
          await db.batch(batch);
        }
      } catch (err) { 
        console.error('deleteInvoice DB error:', err);
        throw err;
      }
      if (!skipFetch) await fetchData();
    } else {
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      LS.set('invoices', updated);
      
      if (paymentToDelete) {
        const updatedPays = payments.filter(p => p.id !== paymentToDelete.id);
        setPayments(updatedPays);
        LS.set('payments', updatedPays);
      }
      
      const sub = subscribers.find(s => s.id === inv.subscriberId);
      if (sub) {
        let newBalance = Number(sub.balance || 0) + Number(inv.amount);
        if (paymentToDelete) newBalance -= Number(paymentToDelete.amount);
        
        // Clear unpaid months if balance is now >= 0, otherwise trim last entry
        let updatedMonths = [...sub.unpaidMonths];
        if (newBalance >= 0) {
          updatedMonths = [];
        } else if (updatedMonths.length > 0) {
          updatedMonths = updatedMonths.slice(0, -1);
        }
        // If deleting a legacy invoice, restore the opening_balance that was zeroed on generation
        const restoredOpeningBalance = inv.type === 'legacy'
          ? (Number(sub.openingBalance) || 0) + Number(inv.amount)
          : (Number(sub.openingBalance) || 0);
        const updatedSubs = subscribers.map(s => 
          s.id === sub.id ? { ...s, balance: newBalance, unpaidMonths: updatedMonths, openingBalance: restoredOpeningBalance } : s
        );
        setSubscribers(updatedSubs);
        LS.set('subscribers', updatedSubs);

        // Sync statuses chronologically (Legacy first) for REMAINING invoices
        const remainingInvoices = updated
          .filter(i => i.subscriberId === sub.id)
          .sort((a, b) => {
            const typeA = a.type === 'legacy' ? 0 : 1;
            const typeB = b.type === 'legacy' ? 0 : 1;
            if (typeA !== typeB) return typeA - typeB;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
        
        const totalInvoiced = remainingInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
        const totalPaid = newBalance + totalInvoiced + restoredOpeningBalance;
        
        let covered = totalPaid;
        const finalInvoices = updated.map(i => {
          if (i.subscriberId !== sub.id) return i;
          const invAmount = Number(i.amount || 0);
          if (covered >= invAmount - 0.01) {
            covered -= invAmount;
            return { ...i, status: 'paid' as const };
          } else {
            return { ...i, status: 'pending' as const };
          }
        });
        setInvoices(finalInvoices);
        LS.set('invoices', finalInvoices);
      }
    }
  };

  const bulkDeleteInvoices = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    
    const validIds = Array.from(new Set(ids.filter(id => id && typeof id === 'string')));
    if (validIds.length === 0) return;

    const idSet = new Set(validIds);
    const toDelete = invoices.filter(inv => idSet.has(inv.id));
    if (toDelete.length === 0) return;

    // 1. Optimistic Local Update
    const subUpdates = new Map<string, { amount: number, count: number, legacyAmount: number, paymentAmount: number, paymentIds: string[] }>();
    const paymentsToDelete = new Set<string>();
    
    toDelete.forEach(inv => {
      if (!inv.subscriberId) return;
      
      const matchingPayments = payments.filter(p => p.subscriberId === inv.subscriberId && Number(p.amount) === Number(inv.amount) && !paymentsToDelete.has(p.id));
      matchingPayments.sort((a, b) => Math.abs(new Date(a.date).getTime() - new Date(inv.date).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(inv.date).getTime()));
      const pToDelete = matchingPayments.length > 0 && Math.abs(new Date(matchingPayments[0].date).getTime() - new Date(inv.date).getTime()) < 35 * 24 * 60 * 60 * 1000 ? matchingPayments[0] : null;
      
      let pAmount = 0;
      if (pToDelete) {
        paymentsToDelete.add(pToDelete.id);
        pAmount = Number(pToDelete.amount);
      }
      
      const cur = subUpdates.get(inv.subscriberId) || { amount: 0, count: 0, legacyAmount: 0, paymentAmount: 0, paymentIds: [] };
      subUpdates.set(inv.subscriberId, {
        amount: cur.amount + (Number(inv.amount) || 0),
        count: cur.count + 1,
        legacyAmount: cur.legacyAmount + (inv.type === 'legacy' ? (Number(inv.amount) || 0) : 0),
        paymentAmount: cur.paymentAmount + pAmount,
        paymentIds: [...cur.paymentIds, ...(pToDelete ? [pToDelete.id] : [])]
      });
    });

    const nextInvoices = invoices.filter(inv => !idSet.has(inv.id));
    const nextPayments = payments.filter(p => !paymentsToDelete.has(p.id));
    const nextSubscribers = subscribers.map(s => {
      const update = subUpdates.get(s.id);
      if (!update) return s;
      const newBalance = Number(s.balance || 0) + update.amount - update.paymentAmount;
      const newOpeningBalance = Number(s.openingBalance || 0) + update.legacyAmount;
      let newUnpaid = [...(s.unpaidMonths || [])];
      if (newBalance >= 0) newUnpaid = [];
      else if (newUnpaid.length > 0) newUnpaid = newUnpaid.slice(0, Math.max(0, newUnpaid.length - update.count));
      return { ...s, balance: newBalance, unpaidMonths: newUnpaid, openingBalance: newOpeningBalance };
    });

    setInvoices(nextInvoices);
    setPayments(nextPayments);
    setSubscribers(nextSubscribers);
    try {
      LS.set('invoices', nextInvoices);
      LS.set('payments', nextPayments);
      LS.set('subscribers', nextSubscribers);
    } catch (e) { console.error('LS error:', e); }

    // 2. DB Update
    if (db) {
      try {
        // We process in small groups of 10 atomic batches to stay well within connection limits
        for (let i = 0; i < toDelete.length; i += 10) {
          const chunk = toDelete.slice(i, i + 10);
          const subMap = new Map(nextSubscribers.map(s => [s.id, s]));
          
          await Promise.all(chunk.map(async (inv) => {
            const s = subMap.get(inv.subscriberId);
            const pIds = subUpdates.get(inv.subscriberId)?.paymentIds || [];
            
            const batch: any[] = [{ sql: 'DELETE FROM invoices WHERE id = ?', args: [inv.id] }];
            
            // Delete payments that were matched for this subscriber (note: this might execute the same payment delete multiple times for the same subscriber if they have multiple invoices in a chunk, but DELETE is idempotent)
            pIds.forEach(pid => batch.push({ sql: 'DELETE FROM payments WHERE id = ?', args: [pid] }));
            
            if (s) {
              batch.push({ 
                sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ?, opening_balance = ? WHERE id = ?', 
                args: [Number(s.balance) || 0, JSON.stringify(s.unpaidMonths || []), Number(s.openingBalance || 0), String(s.id)] 
              });
            }
            return db.batch(batch);
          }));
        }
      } catch (err) {
        console.error('Bulk delete DB error:', err);
        await fetchData(); // Final sync
        throw err;
      }
    }
  };

  const recalculateBalances = async (targetSubId?: string) => {
    if (!db) return;
    setIsLoading(true);
    try {
      // ── Cleanup: Deduplicate Legacy Invoices ──
      const [allInvs] = await Promise.all([
        db.execute("SELECT id, subscriber_id, type FROM invoices WHERE type = 'legacy'")
      ]);
      const legacyMap: Record<string, string[]> = {};
      allInvs.rows.forEach(r => {
        const sid = String(r.subscriber_id !== undefined ? r.subscriber_id : r[1]);
        const id = String(r.id !== undefined ? r.id : r[0]);
        if (!legacyMap[sid]) legacyMap[sid] = [];
        legacyMap[sid].push(id);
      });
      const deleteIds: string[] = [];
      Object.values(legacyMap).forEach(ids => {
        if (ids.length > 1) {
          deleteIds.push(...ids.slice(1));
        }
      });
      if (deleteIds.length > 0) {
        for (let i = 0; i < deleteIds.length; i += 50) {
          const chunk = deleteIds.slice(i, i + 50);
          await db.execute(`DELETE FROM invoices WHERE id IN (${chunk.map(() => '?').join(',')})`, chunk);
        }
      }

      const [invRes, payRes, subRes] = await Promise.all([
        db.execute(targetSubId ? { sql: 'SELECT id, subscriber_id, amount, status, type, date FROM invoices WHERE subscriber_id = ? ORDER BY date ASC', args: [targetSubId] } : 'SELECT id, subscriber_id, amount, status, type, date FROM invoices ORDER BY date ASC'),
        db.execute(targetSubId ? { sql: 'SELECT subscriber_id, amount, discount FROM payments WHERE subscriber_id = ?', args: [targetSubId] } : 'SELECT subscriber_id, amount, discount FROM payments'),
        db.execute(targetSubId ? { sql: 'SELECT id, opening_balance FROM subscribers WHERE id = ?', args: [targetSubId] } : 'SELECT id, opening_balance FROM subscribers')
      ]);

      const invoicesBySub: Record<string, any[]> = {};
      invRes.rows.forEach(r => {
        const row = mapRow(invRes.columns, r);
        const sid = String(row.subscriber_id);
        if (!invoicesBySub[sid]) invoicesBySub[sid] = [];
        invoicesBySub[sid].push(row);
      });

      const totalCashMap: Record<string, number> = {};
      const totalDiscountMap: Record<string, number> = {};
      payRes.rows.forEach(r => {
        const row = mapRow(payRes.columns, r);
        const sid = String(row.subscriber_id);
        const amt = Number(row.amount) || 0;
        const disc = Number(row.discount) || 0;
        totalCashMap[sid] = (totalCashMap[sid] || 0) + amt;
        totalDiscountMap[sid] = (totalDiscountMap[sid] || 0) + disc;
      });

      const batch: any[] = [];
      for (const subRow of subRes.rows) {
        const sub = mapRow(subRes.columns, subRow);
        const sid = String(sub.id);
        const subInvoices = (invoicesBySub[sid] || []).sort((a, b) => {
          const typeA = a.type === 'legacy' ? 0 : 1;
          const typeB = b.type === 'legacy' ? 0 : 1;
          if (typeA !== typeB) return typeA - typeB;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        const totalInvoiced = subInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
        const totalCash = totalCashMap[sid] || 0;
        const totalDiscount = totalDiscountMap[sid] || 0;
        const openingBal = Number(sub.opening_balance || 0);
        const totalDebt = totalInvoiced + openingBal;
        
        let balance = (totalCash + totalDiscount) - totalDebt;
        // Logic: Discounts should never create an 'Advance' (positive balance).
        // Only actual cash overpayments create credit.
        if (balance > 0) {
            balance = Math.max(0, totalCash - totalDebt);
        }

        let updatedMonths: string[] = [];
        if (balance < -0.01) {
            let runningSum = 0;
            const targetAbs = Math.abs(balance);
            const sortedDesc = [...subInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            for (const inv of sortedDesc) {
                if (runningSum < targetAbs) {
                    const mName = new Date(String(inv.date)).toLocaleString('default', { month: 'long', year: 'numeric' });
                    if (!updatedMonths.includes(mName)) updatedMonths.unshift(mName);
                    runningSum += Number(inv.amount || 0);
                } else break;
            }
        }

        batch.push({
          sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ? WHERE id = ?',
          args: [balance, JSON.stringify(updatedMonths), sid]
        });

        let covered = (totalCashMap[sid] || 0) + (totalDiscountMap[sid] || 0) - openingBal;
        for (const inv of subInvoices) {
          const invAmount = Number(inv.amount || 0);
          if (covered >= invAmount - 0.01) {
            if (inv.status !== 'paid') batch.push({ sql: "UPDATE invoices SET status = 'paid' WHERE id = ?", args: [String(inv.id)] });
            covered -= invAmount;
          } else {
            if (inv.status === 'paid') batch.push({ sql: "UPDATE invoices SET status = 'pending' WHERE id = ?", args: [String(inv.id)] });
            covered -= invAmount;
          }
        }
      }

      if (batch.length > 0) {
        for (let i = 0; i < batch.length; i += 50) {
            await db.batch(batch.slice(i, i + 50));
        }
      }
      return true;
    } catch (err) {
      console.error('recalculateBalances error:', err);
      return false;
    } finally {
      await fetchData();
      setIsLoading(false);
    }
  };

  const runBulkBilling = async (startDate?: Date, numMonths: number = 1, includePreviousDue: boolean = false) => {
    let legacyGenerated = 0;
    const stats = { total: 0, generated: 0, skipped: 0 };

    if (includePreviousDue) {
      legacyGenerated = await runLegacyBulkBilling(startDate);
    }

    for (let m = 0; m < numMonths; m++) {
      const targetDate = new Date(startDate || new Date());
      targetDate.setMonth(targetDate.getMonth() + m);
      // Force to midday to avoid timezone shifts jumping to previous/next month
      targetDate.setHours(12, 0, 0, 0); 
      const monthStats = await runSingleMonthBulkBilling(targetDate);
      if (monthStats) {
        stats.total = monthStats.total;
        stats.generated += monthStats.generated;
        stats.skipped += monthStats.skipped;
      }
    }
    await recalculateBalances();
    return { ...stats, legacyGenerated };
  };

  const runLegacyBulkBilling = async (customDate?: Date) => {
    let legacyGenerated = 0;
    // Include any subscriber who isn't active but has a debt
    // We check for 'inactive', 'expired', and any status that isn't 'active'
      const eligibleSubs = subscribers.filter((s) => {
        const hasDebt = (Number(s.openingBalance) || 0) > 0 || (Number(s.balance) || 0) < 0;
        return hasDebt;
      });
    if (eligibleSubs.length === 0) return 0;

    const newInvoices: Invoice[] = [];
    const updatedSubsList = [...subscribers];
    const statements: any[] = [];
    
    const billingDate = normalizeBillingDate(customDate);

    for (const sub of eligibleSubs) {
      const hasLegacy = invoices.some(inv => inv.subscriberId === sub.id && inv.type === 'legacy') ||
                        newInvoices.some(inv => inv.subscriberId === sub.id && inv.type === 'legacy');
      if (hasLegacy) continue;

      const id = `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const number = generateSequentialId('#SCN-IN-', [...invoices, ...newInvoices], 'number');
      const date = billingDate.toISOString();
      const dueDate = createInvoiceDueDate(billingDate).toISOString();
      
      // Amount calculation:
      // Exclusively use the opening balance (amount inserted by the user).
      // This prevents any carry-forward duplication or consolidation issues.
      const total = Number(sub.openingBalance || 0);
      
      if (total <= 0) continue;

      const gst = 0;
      const billingPeriod = 'PREVIOUS YEAR';
      const newInv: Invoice = {
        id, number, subscriberId: sub.id, amount: total, status: 'pending', date, dueDate, gstAmount: gst, type: 'legacy', billingPeriod
      };
      newInvoices.push(newInv);

      const subIndex = updatedSubsList.findIndex(s => s.id === sub.id);
      if (subIndex !== -1) {
        // Only reset openingBalance to 0, balance remains as it is accounted for by the new invoice
        updatedSubsList[subIndex] = { ...updatedSubsList[subIndex], openingBalance: 0 };
        legacyGenerated++;
        
        if (db) {
          statements.push({
            sql: 'INSERT INTO invoices (id, number, subscriber_id, amount, gst_amount, date, due_date, status, type, billing_period, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            args: [id, number, sub.id, total, gst, date, dueDate, 'pending', 'legacy', 'PREVIOUS YEAR', 0]
          });
          statements.push({
            sql: 'UPDATE subscribers SET opening_balance = 0 WHERE id = ?',
            args: [sub.id]
          });
        }
      }
    }

    if (statements.length > 0) {
      if (db) {
        try {
          for (let i = 0; i < statements.length; i += 50) {
            await db.batch(statements.slice(i, i + 50));
          }
        } catch (err) {
          console.error('runLegacyBulkBilling DB error:', err);
          throw err;
        }
      } else {
        // Fallback for local storage if no db
        LS.set('invoices', [...invoices, ...newInvoices]);
        LS.set('subscribers', updatedSubsList);
      }
      setInvoices(prev => [...prev, ...newInvoices]);
      setSubscribers(updatedSubsList);
    }
    return legacyGenerated;
  };

  const runSingleMonthBulkBilling = async (customDate?: Date) => {
    const activeSubs = subscribers.filter(s => s.status === 'active');
    const stats = { total: activeSubs.length, generated: 0, skipped: 0 };
    if (activeSubs.length === 0) return stats;

    const newInvoices: Invoice[] = [];
    const updatedSubsList = [...subscribers];
    const statements: any[] = [];
    
    const billingDate = normalizeBillingDate(customDate);
    const currentMonthStr = billingDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const currentMonth = billingDate.getMonth();
    const currentYear = billingDate.getFullYear();

    for (const sub of activeSubs) {
      const plan = plansList.find(p => p.id === sub.planId);
      if (!plan) continue;

      const currentExpiry = sub.expiryDate ? new Date(sub.expiryDate) : null;
      if (currentExpiry && currentExpiry > billingDate) {
        stats.skipped++;
        continue;
      }

      // Prevent generating multiple invoices for the same month
      // Normalize both dates to start of month for robust comparison
      const hasInvoiceThisMonth = invoices.some(inv => {
        if (inv.subscriberId !== sub.id) return false;
        if (inv.type === 'legacy') return false; // Legacy invoices don't block plan bills
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });
      
      if (hasInvoiceThisMonth) {
        stats.skipped++;
        console.log(`Skipping sub ${sub.name} - already has plan invoice for ${currentMonthStr}`);
        continue;
      }

      const id = `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const number = generateSequentialId('#SCN-IN-', [...invoices, ...newInvoices], 'number');
      const date = billingDate.toISOString();
      const dueDate = createInvoiceDueDate(billingDate).toISOString();
      
      const total = plan.price;
      const gst = plan.priceWithoutGst ? (plan.price - plan.priceWithoutGst) : 0;

      const serviceEndDate = createServiceEndDate(billingDate, Number(plan.validityDays || 30));
      const newExpiryDate = serviceEndDate.toISOString();
      const billingPeriod = Number(plan.validityDays || 30) > 31
        ? formatServicePeriod(billingDate, serviceEndDate)
        : currentMonthStr.toUpperCase();
      const newInv: Invoice = {
        id, number, subscriberId: sub.id, amount: total, status: 'pending', date, dueDate, gstAmount: gst, type: 'plan', billingPeriod, discount: 0
      };
      newInvoices.push(newInv);

      const subIndex = updatedSubsList.findIndex(s => s.id === sub.id);
      if (subIndex !== -1) {
        const s = updatedSubsList[subIndex];
        const newBalance = Number(s.balance || 0) - total;
        const updatedMonths = [...s.unpaidMonths];
        if (!updatedMonths.includes(currentMonthStr)) {
          updatedMonths.push(currentMonthStr);
        }
        updatedSubsList[subIndex] = { ...s, balance: newBalance, unpaidMonths: updatedMonths, expiryDate: newExpiryDate };
        
        if (db) {
          const billingPeriod = currentMonthStr.toUpperCase();
          statements.push({
            sql: 'INSERT INTO invoices (id, number, subscriber_id, amount, gst_amount, date, due_date, status, type, billing_period, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            args: [id, number, sub.id, total, gst, date, dueDate, 'pending', 'plan', billingPeriod, 0]
          });
          statements.push({
            sql: 'UPDATE subscribers SET balance = ?, unpaid_months = ?, expiry_date = ? WHERE id = ?',
            args: [newBalance, JSON.stringify(updatedMonths), newExpiryDate, sub.id]
          });
        }
      }
      stats.generated++;
    }

    // 1. Optimistic UI Updates
    const allInvoices = [...newInvoices, ...invoices];
    setInvoices(allInvoices);
    LS.set('invoices', allInvoices);
    setSubscribers(updatedSubsList);
    LS.set('subscribers', updatedSubsList);

    // 2. Database Batching
    if (db && statements.length > 0) {
      try {
        for (let i = 0; i < statements.length; i += 50) {
          await db.batch(statements.slice(i, i + 50));
        }
      } catch (err) {
        console.error('runBulkBilling DB error:', err);
        await fetchData(); // Rollback on failure
        throw err;
      }
    }
    return stats;
  };

  const addExpense = async (eData: Omit<Expense, 'id'>) => {
    const id = `EXP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newExp: Expense = { id, ...eData };

    if (db) {
      try {
        await db.execute({
          sql: 'INSERT INTO expenses (id, category, description, amount, date) VALUES (?, ?, ?, ?, ?)',
          args: [id, eData.category, eData.description, eData.amount, eData.date],
        });
      } catch (err) { console.error('addExpense DB error:', err); }
      await fetchData();
    } else {
      const updated = [...expenses, newExp];
      setExpenses(updated);
      LS.set('expenses', updated);
    }
  };

  const deleteExpense = async (id: string) => {
    if (db) {
      try {
        await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [id] });
      } catch (err) { console.error('deleteExpense DB error:', err); }
      await fetchData();
    } else {
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      LS.set('expenses', updated);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    const dDate = dashboardDate || today;

    const collectedToday  = payments
      .filter(p => p.date && new Date(p.date).toDateString() === today.toDateString())
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const monthRevenue    = payments
      .filter(p => p.date && new Date(p.date).getMonth() === dDate.getMonth() && new Date(p.date).getFullYear() === dDate.getFullYear())
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const monthExpenses   = expenses
      .filter(e => e.date && new Date(e.date).getMonth() === dDate.getMonth() && new Date(e.date).getFullYear() === dDate.getFullYear())
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    // Pending dues = sum of unpaid invoice amounts (single source of truth)
    // This matches the Invoices page and avoids orphan-balance mismatches
    const pendingDues = subscribers.reduce((sum, sub) => {
      const subInvoices = invoices.filter(inv => inv.subscriberId === sub.id);
      const subPayments = payments.filter(p => p.subscriberId === sub.id);
      
      const totalInvoiced = subInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const totalPaid = subPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const openingBal = Number(sub.openingBalance || 0);
      
      const realBalance = totalPaid - totalInvoiced - openingBal;
      return sum + (realBalance < 0 ? Math.abs(realBalance) : 0);
    }, 0);
    
    const expiringCount   = subscribers
      .filter(s => s.expiryDate && new Date(s.expiryDate) < new Date(today.getTime() + 7 * 86400000) && s.status === 'active')
      .length;

    return { 
      collectedToday, 
      monthRevenue, 
      monthExpenses, 
      pendingDues, 
      expiringCount, 
      totalSubscribers: subscribers.length, 
      active: subscribers.filter(s => s.status === 'active').length, 
      expired: subscribers.filter(s => s.status === 'expired').length 
    };
  }, [subscribers, payments, expenses, invoices, dashboardDate]);

  const updateCompanySettings = async (settings: CompanySettings) => {
    const cleanedSettings = {
      ...settings,
      name: cleanBrandValue(settings.name, BRAND_NAME),
      address: cleanBrandValue(settings.address, BRAND_ADDRESS),
      phone: cleanBrandValue(settings.phone, BRAND_PHONE),
      email: cleanBrandValue(settings.email, BRAND_EMAIL),
      gstin: cleanBrandValue(settings.gstin, ''),
      upiId: cleanBrandValue(settings.upiId, BRAND_UPI),
    };
    if (db) {
      try {
        await db.execute({
          sql: 'UPDATE company_settings SET name = ?, address = ?, phone = ?, email = ?, gstin = ?, upi_id = ? WHERE id = 1',
          args: [cleanedSettings.name, cleanedSettings.address, cleanedSettings.phone, cleanedSettings.email, cleanedSettings.gstin, cleanedSettings.upiId]
        });

        const verifyResult = await db.execute('SELECT COUNT(*) as count FROM company_settings WHERE id = 1');
        const countRow = verifyResult.rows[0] ? mapRow(verifyResult.columns, verifyResult.rows[0]) : { count: 0 };

        if (Number(countRow.count || 0) === 0) {
          await db.execute({
            sql: 'INSERT INTO company_settings (id, name, address, phone, email, gstin, upi_id) VALUES (1, ?, ?, ?, ?, ?, ?)',
            args: [cleanedSettings.name, cleanedSettings.address, cleanedSettings.phone, cleanedSettings.email, cleanedSettings.gstin, cleanedSettings.upiId]
          });
        }
      } catch (error) {
        // Fall back to insert if the row or table state is inconsistent.
        await db.execute({
          sql: 'INSERT OR REPLACE INTO company_settings (id, name, address, phone, email, gstin, upi_id) VALUES (1, ?, ?, ?, ?, ?, ?)',
          args: [cleanedSettings.name, cleanedSettings.address, cleanedSettings.phone, cleanedSettings.email, cleanedSettings.gstin, cleanedSettings.upiId]
        });
      }
    }
    setCompanySettings(cleanedSettings);
  };

  const runAutoLegacyBilling = useCallback(async () => {
    try {
      await runLegacyBulkBilling(new Date(new Date().getFullYear(), 0, 1));
      await fetchData();
    } catch (err) {
      console.error('runAutoLegacyBilling error:', err);
    }
  }, [runLegacyBulkBilling, fetchData]);

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <BillingContext.Provider value={{
      subscribers, agents, plans: plansList, payments, invoices, expenses, reminders, isLoading,
      addSubscriber, updateSubscriber, deleteSubscriber,
      addPlan, updatePlan, deletePlan,
      generateInvoice, deleteInvoice, bulkDeleteInvoices, runBulkBilling, runAutoLegacyBilling,
      recordPayment, deletePayment,
      addExpense, deleteExpense,
      stats, dashboardDate, setDashboardDate, companySettings, updateCompanySettings,
      refreshData: fetchData,
      recalculateBalances,
      importBackupData: async (data: any) => {
        if (db) {
          try {
            const queries: any[] = [
              'DELETE FROM subscribers',
              'DELETE FROM payments',
              'DELETE FROM invoices',
              'DELETE FROM expenses',
              'DELETE FROM reminders',
              'DELETE FROM agents',
              'DELETE FROM plans',
              'DELETE FROM company_settings'
            ];

            if (data.subscribers) {
              data.subscribers.forEach((s: any) => {
                queries.push({
                  sql: 'INSERT INTO subscribers (id, code, name, phone, area, customer_id, customer_username, customer_password, email, plan_id, status, expiry_date, balance, auto_billing, unpaid_months, house_no, landmark, installation_date, opening_balance, customer_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  args: [
                    s.id, s.code, s.name, s.phone, s.area, s.customerId || '', s.customerUsername || '', s.customerPassword || '', s.email || '', s.planId, s.status,
                    s.expiryDate, s.balance, s.autoBilling ? 1 : 0, JSON.stringify(s.unpaidMonths || []),
                    s.houseNo || '', s.landmark || '', s.installationDate || '', s.openingBalance || 0,
                    s.customerNo || 0
                  ]
                });
              });
            }
            if (data.payments) {
              data.payments.forEach((p: any) => {
                queries.push({
                  sql: 'INSERT INTO payments (id, subscriber_id, amount, method, agent, date, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  args: [p.id, p.subscriberId, p.amount, p.method, p.agent, p.date, p.discount || 0]
                });
              });
            }
            if (data.invoices) {
              data.invoices.forEach((i: any) => {
                queries.push({
                  sql: 'INSERT INTO invoices (id, number, subscriber_id, amount, gst_amount, date, due_date, status, type, billing_period, discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  args: [i.id, i.number, i.subscriberId, i.amount, i.gstAmount, i.date, i.dueDate, i.status, i.type || 'plan', i.billingPeriod || '', i.discount || 0]
                });
              });
            }
            if (data.expenses) {
              data.expenses.forEach((e: any) => {
                queries.push({
                  sql: 'INSERT INTO expenses (id, category, description, amount, date) VALUES (?, ?, ?, ?, ?)',
                  args: [e.id, e.category, e.description, e.amount, e.date]
                });
              });
            }
            if (data.reminders) {
              data.reminders.forEach((r: any) => {
                queries.push({
                  sql: 'INSERT INTO reminders (id, subscriber_id, type, channel, status, scheduled_at, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  args: [r.id, r.subscriberId, r.type, r.channel, r.status, r.scheduledAt, r.sentAt]
                });
              });
            }
            if (data.agents) {
              data.agents.forEach((a: any) => {
                queries.push({
                  sql: 'INSERT INTO agents (id, name, phone, areas, status, join_date) VALUES (?, ?, ?, ?, ?, ?)',
                  args: [a.id, a.name, a.phone, JSON.stringify(a.areas || []), a.status, a.joinDate]
                });
              });
            }
            if (data.plans) {
              data.plans.forEach((p: any) => {
                queries.push({
                  sql: 'INSERT INTO plans (id, name, price, validity_days, speed_mbps) VALUES (?, ?, ?, ?, ?)',
                  args: [p.id, p.name, p.price, p.validityDays, p.speedMbps]
                });
              });
            }
            if (data.companySettings) {
              const s = data.companySettings;
              queries.push({
                sql: 'INSERT INTO company_settings (id, name, address, phone, email, gstin, upi_id) VALUES (1, ?, ?, ?, ?, ?, ?)',
                args: [s.name, s.address, s.phone, s.email, s.gstin, s.upiId]
              });
            }

            // Execute in chunks if too many queries
            const CHUNK_SIZE = 50;
            for (let j = 0; j < queries.length; j += CHUNK_SIZE) {
              await db.batch(queries.slice(j, j + CHUNK_SIZE));
            }
            
            await fetchData();
          } catch (err) {
            console.error('importBackupData DB error:', err);
            throw err;
          }
        } else {
          if (data.subscribers) LS.set('subscribers', data.subscribers);
          if (data.payments) LS.set('payments', data.payments);
          if (data.invoices) LS.set('invoices', data.invoices);
          if (data.expenses) LS.set('expenses', data.expenses);
          if (data.reminders) LS.set('reminders', data.reminders);
          if (data.agents) LS.set('agents', data.agents);
          if (data.plans) LS.set('plans', data.plans);
          await fetchData();
        }
      }
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within a BillingProvider');
  return ctx;
};

