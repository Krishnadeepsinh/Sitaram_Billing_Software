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
    <>
      <div className="grid grid-cols-[1fr_1fr_1.35fr_1fr] gap-4 border-b border-slate-200 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Invoice No.</p>
          <p className="mt-2 text-base font-black text-[#1e3a5f]">{invoice.number}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Invoice Date</p>
          <p className="mt-2 text-base font-black text-[#1e3a5f]">{formatDate(invoice.date)}</p>
        </div>
        <div className="rounded-2xl border border-[#1e3a5f] bg-gradient-to-br from-[#1e3a5f] via-[#22446d] to-[#2c5b90] px-5 py-4 text-center shadow-lg shadow-slate-200">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">Billing Period</p>
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">Service Window</p>
          <p className="mt-1 text-lg font-black leading-tight text-white">{billingPeriodLabel}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Due Date</p>
          <p className="mt-2 text-base font-black text-[#1e3a5f]">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      {invoice.type !== "legacy" && (
        <div className="grid grid-cols-2 gap-4 mt-4 mb-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Recharge Date</p>
            <p className="mt-1 text-sm font-black text-[#1e3a5f]">{rechargeDate ? formatDate(rechargeDate) : "-"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Expiry Date</p>
            <p className="mt-1 text-sm font-black text-[#1e3a5f]">{expiryDate ? formatDate(expiryDate) : "-"}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Connection ID</span>
            <span className="mt-1 text-sm font-black uppercase text-[#1e3a5f]">{connectionId}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Invoice State</p>
              <p className="mt-1 text-xs font-black uppercase text-slate-700">{invoiceStatusLabel}</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${stateTone}`}>
              <span className="h-2 w-2 rounded-full bg-current opacity-80" />
              {invoiceStateLabel}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
