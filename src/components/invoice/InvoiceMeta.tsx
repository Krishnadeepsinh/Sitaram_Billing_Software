import { formatDate } from "@/lib/mockData";

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
  billingPeriodLabel,
}: InvoiceMetaProps) {
  return (
    <div className="grid grid-cols-4 gap-4 py-8">
      {/* INVOICE NO */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 flex flex-col justify-between h-[72px] transition-all hover:shadow-sm">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Reference No.</p>
        <p className="text-sm font-black text-slate-900 tracking-tight">{invoice.number}</p>
      </div>
      
      {/* INVOICE DATE */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 flex flex-col justify-between h-[72px] transition-all hover:shadow-sm">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Issue Date</p>
        <p className="text-sm font-bold text-slate-700">{formatDate(invoice.date)}</p>
      </div>
      
      {/* BILLING PERIOD */}
      <div className="rounded-2xl bg-[#0f172a] px-5 py-4 flex flex-col justify-between h-[72px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#F47920]" />
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-400/80">Service Period</p>
        <p className="text-sm font-black text-white tracking-tight leading-tight">{billingPeriodLabel}</p>
      </div>
      
      {/* DUE DATE */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/30 px-5 py-4 flex flex-col justify-between h-[72px] transition-all hover:shadow-sm">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-400">Due By</p>
        <p className="text-sm font-black text-rose-600 tracking-tight">{formatDate(invoice.dueDate)}</p>
      </div>
    </div>
  );
}
