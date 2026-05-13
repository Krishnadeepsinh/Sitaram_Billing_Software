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
  const connectionId = getConnectionId(subscriber, invoice);
  const invoiceStateLabel = String(invoice?.status || "pending").toUpperCase();
  const stateTone =
    invoice?.status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : invoice?.status === "overdue"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 border-b border-slate-100 pb-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Invoice No.</p>
          <p className="mt-1 text-sm font-black text-[#1e3a5f]">{invoice.number}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Invoice Date</p>
          <p className="mt-1 text-sm font-black text-[#1e3a5f]">{formatDate(invoice.date)}</p>
        </div>
        <div className="rounded-xl border border-[#1e3a5f] bg-[#1e3a5f] px-3 py-3 text-center shadow-lg">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-100">Service Window</p>
          <p className="mt-1 text-[11px] font-black leading-tight text-white">{billingPeriodLabel}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Due Date</p>
          <p className="mt-1 text-sm font-black text-rose-600">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-slate-50/80 rounded-xl border border-slate-100">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">User ID / Conn ID</span>
            <span className="text-[11px] font-black text-[#1e3a5f] uppercase">{connectionId}</span>
          </div>
          {rechargeDate && (
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Plan Period</span>
              <span className="text-[10px] font-bold text-slate-600">
                {formatDate(rechargeDate)} - {expiryDate ? formatDate(expiryDate) : "N/A"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status:</span>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase border ${stateTone}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {invoiceStateLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
