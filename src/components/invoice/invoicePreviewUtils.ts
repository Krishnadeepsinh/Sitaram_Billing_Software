import { formatMonthRanges } from "@/lib/mockData";

const MIDDAY_BUFFER_MS = 12 * 60 * 60 * 1000;

export const getInvoiceDisplayDate = (dateValue?: string) =>
  new Date(new Date(dateValue || new Date().toISOString()).getTime() + MIDDAY_BUFFER_MS);

export const getInvoiceLabel = (invoice: any, isCableMode: boolean) => {
  if (invoice?.type === "legacy") return "Previous Due";
  return isCableMode ? "Cable Bill" : "Broadband Bill";
};

export const getInvoiceStatusLabel = (invoice: any, isCableMode: boolean) => {
  if (invoice?.type === "legacy") return "PREVIOUS DUE";
  return isCableMode ? "CABLE BILL" : "BROADBAND BILL";
};

export const getBillingPeriodLabel = (invoice: any, subscriber?: any, plans?: any[]) => {
  if (invoice?.billingPeriod) return invoice.billingPeriod;
  if (invoice?.type === "legacy") return "PREVIOUS YEAR";
  
  if (subscriber && plans) {
    const plan = plans.find((item) => item.id === (invoice.planId || subscriber.planId));
    const grossAmount = Number(invoice?.amount || 0) + Number(invoice?.discount || 0);
    const basePrice = Math.max(1, Number(plan?.price || grossAmount || 1));
    const cycles = Math.max(1, Math.round(grossAmount / basePrice));
    
    if (cycles > 1) {
      const startDate = getInvoiceDisplayDate(invoice?.date);
      const months = Array.from({ length: cycles }).map((_, i) => {
        const d = new Date(startDate);
        d.setMonth(startDate.getMonth() + i);
        return d;
      });
      return formatMonthRanges(months).toUpperCase();
    }
  }

  return getInvoiceDisplayDate(invoice?.date).toLocaleString("default", {
    month: "long",
    year: "numeric",
  }).toUpperCase();
};

export const getInvoiceServiceDates = (invoice: any, subscriber: any, plans: any[]) => {
  if (invoice?.type === "legacy") {
    return { rechargeDate: "", expiryDate: "" };
  }

  const plan = plans.find((item) => item.id === subscriber?.planId);
  const grossAmount = Number(invoice?.amount || 0) + Number(invoice?.discount || 0);
  const basePrice = Math.max(1, Number(plan?.price || grossAmount || 1));
  const cycles = Math.max(1, Math.round(grossAmount / basePrice));
  const rechargeDate = getInvoiceDisplayDate(invoice?.date);
  const expiryDate = new Date(rechargeDate);
  expiryDate.setDate(expiryDate.getDate() + Math.max(1, Number(plan?.validityDays || 30) * cycles) - 1);

  return {
    rechargeDate: rechargeDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
  };
};

export const getConnectionId = (subscriber: any, invoice: any) =>
  (subscriber as any)?.code || (subscriber as any)?.customerId || `SCB-AHM-${String(invoice?.subscriberId || "").padStart(5, "0")}`;

export const getSubscriberAddressLines = (subscriber: any) => {
  if (!subscriber) return ["Address not available"];

  const lineOne = [subscriber.houseNo, subscriber.landmark]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  const lineTwo = String(subscriber.area || "").trim();
  const lines = [lineOne, lineTwo].filter(Boolean);

  return lines.length > 0 ? lines : ["Address not available"];
};

export const getInvoiceLineItem = (invoice: any, subscriber: any, plans: any[], isCableMode: boolean = false) => {
  const grossAmount = Number(invoice?.amount || 0) + Number(invoice?.discount || 0);

  if (invoice?.type === "legacy") {
    return {
      description: "Arrears / Previous Due",
      subDescription: "Unpaid balance from previous billing periods",
      quantity: "-",
      rate: grossAmount,
      total: grossAmount,
    };
  }

  const plan = plans.find((item) => item.id === subscriber?.planId);
  const fallbackRate = Math.max(1, Number(plan?.price || grossAmount || 1));
  const quantity = Math.max(1, Math.round(grossAmount / fallbackRate));
  const validityDays = Number(plan?.validityDays || 30);
  const speed = !isCableMode && plan?.speedMbps ? `${plan.speedMbps} Mbps` : "";

  let serviceName = isCableMode ? (plan?.name || "Cable TV Service") : (plan?.name || "Broadband Service");
  
  // Sanitize plan name for Cable mode with a foolproof splitting approach
  if (isCableMode && serviceName) {
    // 1. Manually split by '[' or '(' to remove any trailing metadata blocks
    serviceName = serviceName.split('[')[0].split('(')[0].trim();
    
    // 2. Fallback regex for loose speed indicators not wrapped in brackets
    serviceName = serviceName
      .replace(/\d+\s*(mbps|gbps|kbps)/gi, "")
      .replace(/\[\d+\s*(mbps|gbps|kbps)\]/gi, "")
      .replace(/\(\d+\s*(mbps|gbps|kbps)\)/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    // 3. Fallback if the remaining string is too sparse or just "Plan"
    if (!serviceName || serviceName.length < 3 || serviceName.toLowerCase() === "plan") {
      serviceName = "Cable TV Service";
    }
  }

  if (quantity === 1 && validityDays > 31) {
    return {
      description: `${serviceName}${speed ? ` [${speed}]` : ""} (${invoice?.billingPeriod || `${validityDays} DAYS`})`,
      subDescription: subscriber?.customerUsername
        ? `User ID: ${subscriber.customerUsername}`
        : `${validityDays}-day ${isCableMode ? "cable television" : "high-speed internet"} subscription`,
      quantity: "1",
      rate: grossAmount,
      total: grossAmount,
    };
  }

  const startDate = getInvoiceDisplayDate(invoice?.date);
  const months = Array.from({ length: quantity }).map((_, index) => {
    const nextDate = new Date(startDate);
    nextDate.setMonth(startDate.getMonth() + index);
    return nextDate;
  });
  const rangeLabel = formatMonthRanges(months);

  return {
    description: `${serviceName}${speed ? ` [${speed}]` : ""}${rangeLabel ? ` (${rangeLabel})` : ""}`,
    subDescription: subscriber?.customerUsername
      ? `User ID: ${subscriber.customerUsername}`
      : `Monthly ${isCableMode ? "cable television" : "high-speed broadband"} service`,
    quantity: String(quantity),
    rate: grossAmount / quantity,
    total: grossAmount,
  };
};
