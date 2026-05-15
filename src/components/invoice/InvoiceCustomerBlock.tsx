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

  return (
    <div className="flex-[0.62] bg-[#F4F7FB] p-8 rounded-[1.5rem] border border-[#DDE4EF] flex flex-col justify-between min-h-[140px]">
      <div>
        <p className="text-[#F47920] text-[8px] font-black uppercase tracking-[0.3em] mb-4">BILLING TO</p>
        <h2 className={cn(
          "text-2xl font-black text-[#1E293B] tracking-tight leading-tight mb-2",
          /[\u0a80-\u0aff]/.test(subscriber?.name || "") && "gujarati"
        )}>
          {subscriber?.name || "Valued Customer"}
        </h2>
        <div className="text-[10px] text-[#64748B] space-y-1 font-medium leading-relaxed">
          <p>{addressLines[0] || "No Street Address"}</p>
          <p>{addressLines[1] || "Veraval, Gujarat"}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-6 pt-6 border-t border-[#DDE4EF]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] font-black uppercase text-[#94A3B8] tracking-[0.2em]">Contact</span>
          <span className="text-[10px] font-black text-[#1E293B] tracking-tight">+91 {phone}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] font-black uppercase text-[#94A3B8] tracking-[0.2em]">{customerIdLabel}</span>
          <span className="text-[10px] font-black text-[#1E293B] tracking-tight">{customerIdValue}</span>
        </div>
      </div>
    </div>
  );
}

