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
    <div className="grid grid-cols-4 gap-4 px-12 py-8">
      {/* INVOICE NO */}
      <div className="bg-[#F4F7FB] border border-[#DDE4EF] rounded-[4mm] p-4 flex flex-col justify-center min-h-[17mm]">
        <p className="text-[#94A3B8] text-[6.5px] font-bold uppercase mb-1">INVOICE NO.</p>
        <p className="text-[#1E293B] text-[9px] font-black">{invoice.number || invoice.invoiceNumber || invoice.id}</p>
      </div>
      
      {/* BILLING DATE */}
      <div className="bg-[#F4F7FB] border border-[#DDE4EF] rounded-[4mm] p-4 flex flex-col justify-center min-h-[17mm]">
        <p className="text-[#94A3B8] text-[6.5px] font-bold uppercase mb-1">BILLING DATE</p>
        <p className="text-[#1E293B] text-[9px] font-black">{formatFullDate(invoice.date)}</p>
      </div>
      
      {/* BILLING PERIOD - Highlighted */}
      <div className="bg-[#1B2B4B] rounded-[4mm] p-4 flex flex-col justify-center min-h-[17mm] shadow-lg">
        <p className="text-[#94A3B8] text-[6.5px] font-bold uppercase mb-1">BILLING PERIOD</p>
        <p className="text-white text-[9px] font-black">{billingPeriodLabel}</p>
      </div>
      
      {/* DUE DATE */}
      <div className="bg-[#F4F7FB] border border-[#DDE4EF] rounded-[4mm] p-4 flex flex-col justify-center min-h-[17mm]">
        <p className="text-[#94A3B8] text-[6.5px] font-bold uppercase mb-1">DUE DATE</p>
        <p className="text-[#DC2626] text-[9px] font-black">{formatFullDate(invoice.dueDate)}</p>
      </div>
    </div>
  );
}

