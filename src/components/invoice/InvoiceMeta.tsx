import { formatDate } from "@/lib/mockData";
import { getConnectionId } from "./invoicePreviewUtils";

type InvoiceMetaProps = {
  invoice: any;
  subscriber: any;
  billingPeriodLabel: string;
  invoiceStatusLabel: string;
  rechargeDate?: string;
  expiryDate?: string;
};

export function InvoiceMeta({
  invoice,
  subscriber,
  billingPeriodLabel,
  invoiceStatusLabel,
  rechargeDate,
  expiryDate,
}: InvoiceMetaProps) {
  const isCableMode = invoiceStatusLabel.includes("CABLE");
  const connectionId = getConnectionId(subscriber, invoice);
  const invoiceStateLabel = String(invoice?.status || "pending").toUpperCase();
  const stateTone =
    invoice?.status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : invoice?.status === "overdue"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="grid grid-cols-4 gap-[3mm] py-[4mm]">
      {/* INVOICE NO */}
      <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
        <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Invoice No.</p>
        <p className="text-[9pt] font-bold text-[#1E293B]">{invoice.number}</p>
      </div>
      
      {/* INVOICE DATE */}
      <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
        <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Invoice Date</p>
        <p className="text-[9pt] font-bold text-[#1E293B]">{formatDate(invoice.date)}</p>
      </div>
      
      {/* BILLING PERIOD (Highlighted) */}
      <div className="rounded-[4mm] bg-[#1B2B4B] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
        <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Billing Period</p>
        <p className="text-[9pt] font-bold text-white leading-tight">{billingPeriodLabel}</p>
      </div>
      
      {/* DUE DATE */}
      <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
        <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Due Date</p>
        <p className="text-[9pt] font-bold text-[#DC2626]">{formatDate(invoice.dueDate)}</p>
      </div>
    </div>
  );
}
