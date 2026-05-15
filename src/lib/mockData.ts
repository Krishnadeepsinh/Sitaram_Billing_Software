export type SubscriberStatus = "active" | "expired" | "inactive";

export interface Plan {
  id: string;
  name: string;
  price: number;
  speedMbps: number;
  validityDays: number;
  priceWithoutGst?: number;
  providerPlanId?: string;
  category?: "welcome" | "renewal" | "iptv";
}

export interface Subscriber {
  id: string;
  code: string;
  name: string;
  phone: string;
  area: string; // customer address
  customerId: string;
  customerUsername?: string;
  customerPassword?: string;
  email?: string;
  planId: string;
  status: SubscriberStatus;
  expiryDate: string; // ISO
  balance: number; // negative = due
  autoBilling: boolean; // until admin stops
  unpaidMonths: string[]; // e.g. ["Jan", "Feb", "Mar"]
  houseNo?: string;
  landmark?: string;
  installationDate?: string;
  openingBalance?: number;
  customerNo?: number;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  upiId: string;
}

export interface Invoice {
  id: string;
  number: string;
  subscriberId: string;
  amount: number;
  gstAmount: number;
  date: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  type?: "plan" | "legacy";
  billingPeriod?: string;
  discount?: number;
}

export interface Payment {
  id: string;
  subscriberId: string;
  amount: number;
  method: "Cash" | "UPI";
  agent: string;
  date: string;
  invoiceId?: string;
  discount?: number;
  balanceAtPayment?: number;
  createdAt?: string;
}


export interface Expense {
  id: string;
  category: "Fuel" | "Maintenance" | "Salary" | "Office" | "Internet" | "Other";
  description: string;
  amount: number;
  date: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  areas: string[];
  status: "active" | "inactive";
  joinDate: string;
}

export interface Reminder {
  id: string;
  subscriberId: string;
  type: "bill_generated" | "payment_due" | "overdue" | "promotional";
  channel: "WhatsApp" | "SMS" | "Email";
  status: "sent" | "pending" | "failed";
  scheduledAt: string;
  sentAt?: string;
}

export const getDefaultPlans = (mode: "cable" | "broadband"): Plan[] => {
  if (mode === "cable") {
    return [
      { id: "cp1", name: "Basic Cable Pack", price: 300, speedMbps: 120, validityDays: 30, category: "welcome" },
      { id: "cp2", name: "Family Cable Pack", price: 450, speedMbps: 180, validityDays: 30, category: "welcome" },
      { id: "cp3", name: "Premium Cable Pack", price: 650, speedMbps: 240, validityDays: 30, category: "welcome" },
    ];
  }

  return [
    { id: "bp1", name: "FUP60Mbps-2Mbps 18TB 6Months_single_ANP", price: 3540, priceWithoutGst: 3000, speedMbps: 60, validityDays: 180, providerPlanId: "801307", category: "welcome" },
    { id: "bp2", name: "FUP60Mbps-2Mbps 36TB 12Months_single_ANP", price: 5310, priceWithoutGst: 4500, speedMbps: 60, validityDays: 360, providerPlanId: "801308", category: "welcome" },
    { id: "bp3", name: "FUP100Mbps-2Mbps 18TB 6Months_dual_ANP", price: 4720, priceWithoutGst: 4000, speedMbps: 100, validityDays: 180, providerPlanId: "801309", category: "welcome" },
    { id: "bp4", name: "FUP100Mbps-2Mbps 36TB 12Months_dual_ANP", price: 6924.24, priceWithoutGst: 5868, speedMbps: 100, validityDays: 360, providerPlanId: "801310", category: "welcome" },
    { id: "bp5", name: "FUP150Mbps-2Mbps 18TB 6Months_dual_ANP", price: 5310, priceWithoutGst: 4500, speedMbps: 150, validityDays: 180, providerPlanId: "801311", category: "welcome" },
    { id: "bp6", name: "FUP150Mbps-2Mbps 36TB 12Months_dual_ANP", price: 7773.84, priceWithoutGst: 6588, speedMbps: 150, validityDays: 360, providerPlanId: "801312", category: "welcome" },
    { id: "bp7", name: "FUP60Mbps-2Mbps 2TB x6", price: 3540, priceWithoutGst: 3000, speedMbps: 60, validityDays: 180, providerPlanId: "801313", category: "renewal" },
    { id: "bp8", name: "FUP60Mbps-2Mbps 2TB x12", price: 5310, priceWithoutGst: 4500, speedMbps: 60, validityDays: 360, providerPlanId: "801314", category: "renewal" },
    { id: "bp9", name: "FUP100Mbps-2Mbps 2TB x12", price: 6924, priceWithoutGst: 5868, speedMbps: 100, validityDays: 360, providerPlanId: "801315", category: "renewal" },
    { id: "bp10", name: "FUP100Mbps-2Mbps 2TB x6", price: 4720, priceWithoutGst: 4000, speedMbps: 100, validityDays: 180, providerPlanId: "801316", category: "renewal" },
    { id: "bp11", name: "60 Mbps_2 Mbps(1.5 TB per month) with SD channel", price: 5891, priceWithoutGst: 4992, speedMbps: 60, validityDays: 360, providerPlanId: "801327", category: "iptv" },
    { id: "bp12", name: "60 Mbps_2 Mbps(1.5 TB per month) with HD channel", price: 6230, priceWithoutGst: 5280, speedMbps: 60, validityDays: 360, providerPlanId: "801328", category: "iptv" },
    { id: "bp13", name: "60 Mbps_2 Mbps(1.5 TB per month) with SD channel", price: 2945, priceWithoutGst: 2496, speedMbps: 60, validityDays: 180, providerPlanId: "801329", category: "iptv" },
    { id: "bp14", name: "60 Mbps_2 Mbps(1.5 TB per month) with HD channel", price: 3115, priceWithoutGst: 2640, speedMbps: 60, validityDays: 180, providerPlanId: "801330", category: "iptv" },
  ];
};

export const plans: Plan[] = getDefaultPlans("broadband");

export const subscribers: Subscriber[] = [];
export const invoices: Invoice[] = [];
export const payments: Payment[] = [];
export const expenses: Expense[] = [];
export const reminders: Reminder[] = [];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

export const formatFullDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const formatMonthRanges = (dates: Date[]) => {
  if (dates.length === 0) return "";
  
  const uniqueMonths = new Map<string, Date>();
  dates.forEach(d => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!uniqueMonths.has(key)) {
      uniqueMonths.set(key, new Date(d.getFullYear(), d.getMonth(), 1));
    }
  });
  
  const sortedDates = Array.from(uniqueMonths.values()).sort((a, b) => a.getTime() - b.getTime());
  
  const ranges: string[] = [];
  let rangeStart = sortedDates[0];
  let rangeEnd = sortedDates[0];
  
  const formatSingleRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleString('default', { month: 'short' });
    const endStr = end.toLocaleString('default', { month: 'short' });
    const startYear = start.toLocaleString('default', { year: '2-digit' });
    const endYear = end.toLocaleString('default', { year: '2-digit' });
    
    if (start.getTime() === end.getTime()) {
      return `${startStr} ${startYear}`;
    } else {
      if (startYear === endYear) {
        return `${startStr}-${endStr} ${startYear}`;
      } else {
        return `${startStr} ${startYear} - ${endStr} ${endYear}`;
      }
    }
  };

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i-1];
    const currDate = sortedDates[i];
    const expectedDate = new Date(prevDate);
    expectedDate.setMonth(prevDate.getMonth() + 1);
    
    if (currDate.getMonth() === expectedDate.getMonth() && currDate.getFullYear() === expectedDate.getFullYear()) {
      rangeEnd = currDate;
    } else {
      ranges.push(formatSingleRange(rangeStart, rangeEnd));
      rangeStart = currDate;
      rangeEnd = currDate;
    }
  }
  ranges.push(formatSingleRange(rangeStart, rangeEnd));
  
  return ranges.join(", ");
};
