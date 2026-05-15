import { formatFullDate } from "@/lib/mockData";

type InvoiceMetaProps = {
  invoice: any;
  billingPeriodLabel: string;
};

export function InvoiceMeta({
  invoice,
  billingPeriodLabel,
}: InvoiceMetaProps) {
  return (
    <div className="grid grid-cols-4 gap-3 py-6">
      {/* INVOICE NO */}
      <div className="rounded-2xl border border-[#DDE4EF] bg-[#F4F7FB] px-5 py-4 flex flex-col justify-between h-[68px]">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">REFERENCE NO.</p>
        <p className="text-sm font-black text-[#1E293B] tracking-tight">{invoice.number}</p>
      </div>
      
      {/* INVOICE DATE */}
      <div className="rounded-2xl border border-[#DDE4EF] bg-[#F4F7FB] px-5 py-4 flex flex-col justify-between h-[68px]">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">ISSUE DATE</p>
        <p className="text-sm font-bold text-[#1E293B]">{formatFullDate(invoice.date)}</p>
      </div>
      
      {/* BILLING PERIOD */}
      <div className="rounded-2xl bg-[#1B2B4B] px-5 py-4 flex flex-col justify-between h-[68px] shadow-lg relative overflow-hidden">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#F47920]">SERVICE PERIOD</p>
        <p className="text-sm font-black text-white tracking-tight leading-tight">{billingPeriodLabel}</p>
      </div>
      
      {/* DUE DATE */}
      <div className="rounded-2xl border border-[#DDE4EF] bg-[#F4F7FB] px-5 py-4 flex flex-col justify-between h-[68px]">
        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#DC2626]">DUE BY</p>
        <p className="text-sm font-black text-[#DC2626] tracking-tight">{formatFullDate(invoice.dueDate)}</p>
      </div>
    </div>
  );
}

