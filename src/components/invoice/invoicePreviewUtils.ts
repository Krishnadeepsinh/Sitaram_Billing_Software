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

export const getBillingPeriodLabel = (invoice: any) => {
  if (invoice?.billingPeriod) return invoice.billingPeriod;
  if (invoice?.type === "legacy") return "PREVIOUS YEAR";
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
  (subscriber as any)?.customId || `SCB-AHM-${String(invoice?.subscriberId || "").padStart(5, "0")}`;

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

export const getInvoiceLineItem = (invoice: any, subscriber: any, plans: any[]) => {
  const grossAmount = Number(invoice?.amount || 0) + Number(invoice?.discount || 0);

  if (invoice?.type === "legacy") {
    return {
      description: "Previous Year Billing",
      subDescription: "Previous dues / opening balance",
      quantity: "-",
      rate: grossAmount,
      total: grossAmount,
    };
  }

  const plan = plans.find((item) => item.id === subscriber?.planId);
  const fallbackRate = Math.max(1, Number(plan?.price || grossAmount || 1));
  const quantity = Math.max(1, Math.round(grossAmount / fallbackRate));
  const validityDays = Number(plan?.validityDays || 30);

  if (quantity === 1 && validityDays > 31) {
    return {
      description: `${plan?.name || "Broadband Plan"} (${invoice?.billingPeriod || `${validityDays} DAYS`})`,
      subDescription: subscriber?.customerUsername
        ? `Username: ${subscriber.customerUsername}`
        : `${validityDays}-day service plan`,
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
    description: `${plan?.name || "Basic Pack"}${rangeLabel ? ` (${rangeLabel})` : ""}`,
    subDescription: subscriber?.customerUsername
      ? `Username: ${subscriber.customerUsername}`
      : "Monthly subscription",
    quantity: String(quantity),
    rate: grossAmount / quantity,
    total: grossAmount,
  };
};
