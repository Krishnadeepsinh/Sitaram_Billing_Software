import { cn } from "@/lib/utils";

type InvoiceCustomerBlockProps = {
  subscriber: any;
  customerIdLabel: string;
  isCableMode?: boolean;
};

export function InvoiceCustomerBlock({ subscriber, customerIdLabel, isCableMode }: InvoiceCustomerBlockProps) {
  const addressLines = [
    [subscriber?.houseNo, subscriber?.landmark]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", "),
    String(subscriber?.area || "").trim(),
  ].filter(Boolean);

  const phone = String(subscriber?.phone || "").trim();
  const customerIdValue = String(subscriber?.customerId || "").trim();
  const customerNo = subscriber?.customerNo || subscriber?.customerId || subscriber?.code || "-";

  return (
    <div className="flex-[0.65] bg-slate-50/50 p-8 rounded-3xl border border-slate-100 flex flex-col min-h-[180px] relative overflow-hidden group hover:shadow-sm transition-all">
      {/* Decorative Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-orange-500/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#F47920]" />
          <p className="text-orange-500 text-[8px] font-black uppercase tracking-[0.25em]">Billed To Customer</p>
        </div>
        <div className="bg-[#0f172a] px-2.5 py-1 rounded-full flex items-center gap-1.5">
           <div className="h-1 w-1 rounded-full bg-emerald-400" />
           <span className="text-white text-[7px] font-black uppercase tracking-widest">Active Account</span>
        </div>
      </div>
      
      <div className="flex flex-col mb-4 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Acc No.</span>
          <span className="text-[10px] font-black text-[#0f172a] tracking-tight bg-slate-200/50 px-2 py-0.5 rounded-md">#{customerNo}</span>
        </div>
        <h2 className={cn(
          "text-xl font-black text-slate-900 tracking-tight leading-tight",
          /[\u0a80-\u0aff]/.test(subscriber?.name || "") && "gujarati text-2xl leading-normal"
        )}>
          {subscriber?.name || "Valued Customer"}
        </h2>
      </div>

      <div className="text-[11px] text-slate-600 space-y-1 leading-relaxed flex-1 font-medium relative z-10">
        <p className="text-slate-900 font-semibold">{addressLines[0] || "No Street Address"}</p>
        <p className="text-slate-500">{addressLines[1] || "Bhavnagar District"}</p>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-[9px] font-black text-[#0f172a] uppercase tracking-wider bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
            {subscriber?.area || "Bhavnagar Central"}
          </p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GUJARAT, INDIA</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-6 pt-5 border-t border-slate-200/60 relative z-10">
        {customerIdValue && customerIdValue !== "-" && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] font-black uppercase text-slate-400 tracking-[0.2em]">{isCableMode ? "STB Serial" : "User Identifier"}</span>
            <span className="text-[11px] font-black text-[#0f172a] tracking-tight">{customerIdValue}</span>
          </div>
        )}
        {phone && phone !== "N/A" && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] font-black uppercase text-slate-400 tracking-[0.2em]">Primary Contact</span>
            <span className="text-[11px] font-black text-[#0f172a] tracking-tight">+91 {phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
