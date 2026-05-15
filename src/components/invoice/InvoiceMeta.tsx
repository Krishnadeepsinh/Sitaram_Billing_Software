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
    <div className="grid grid-cols-4 gap-[4mm] py-[6mm]">
      {/* INVOICE NO */}
      <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[4mm] py-[3.5mm] flex flex-col justify-between h-[18mm] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[0.8mm] bg-[#94A3B8] opacity-20" />
        <p className="text-[6.5pt] font-black uppercase tracking-[0.15em] text-[#94A3B8]">Reference No.</p>
        <p className="text-[10pt] font-black text-[#1B2B4B] tracking-tighter">{invoice.number}</p>
      </div>
      
      {/* INVOICE DATE */}
      <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[4mm] py-[3.5mm] flex flex-col justify-between h-[18mm] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[0.8mm] bg-[#94A3B8] opacity-20" />
        <p className="text-[6.5pt] font-black uppercase tracking-[0.15em] text-[#94A3B8]">Issue Date</p>
        <p className="text-[10pt] font-bold text-[#1B2B4B]">{formatDate(invoice.date)}</p>
      </div>
      
      {/* BILLING PERIOD (Highlighted) */}
      <div className="rounded-[4mm] bg-[#1B2B4B] px-[4mm] py-[3.5mm] flex flex-col justify-between h-[18mm] relative overflow-hidden shadow-lg border border-[#1B2B4B]">
        <div className="absolute top-0 left-0 w-[1.2mm] h-full bg-[#F47920]" />
        <p className="text-[6.5pt] font-black uppercase tracking-[0.2em] text-[#94A3B8] ml-1">Service Period</p>
        <p className="text-[10pt] font-black text-slate-800 leading-tight ml-1 tracking-tight">{billingPeriodLabel}</p>
      </div>
      
      {/* DUE DATE */}
      <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[4mm] py-[3.5mm] flex flex-col justify-between h-[18mm] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[0.8mm] bg-[#DC2626] opacity-20" />
        <p className="text-[6.5pt] font-black uppercase tracking-[0.15em] text-[#94A3B8]">Due By</p>
        <p className="text-[10pt] font-black text-[#DC2626] tracking-tighter">{formatDate(invoice.dueDate)}</p>
      </div>
    </div>
  );
}
