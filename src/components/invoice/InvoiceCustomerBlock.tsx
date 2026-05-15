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
    <div className="flex-[0.62] bg-[#F4F7FB] border border-[#DDE4EF] rounded-[4mm] p-8 flex flex-col justify-center min-h-[48mm]">
      <p className="text-[#F47920] text-[7px] font-black uppercase tracking-[0.3em] mb-4">BILLING TO</p>
      
      <h2 className={cn(
        "text-[14px] font-black text-[#1E293B] tracking-tight leading-tight mb-3",
        /[\u0a80-\u0aff]/.test(subscriber?.name || "") && "gujarati"
      )}>
        {subscriber?.name || "Valued Customer"}
      </h2>
      
      <div className="text-[9px] text-[#64748B] space-y-1 font-medium leading-relaxed">
        <p>{addressLines[0] || "No Street Address"}</p>
        <p>{addressLines[1] || "Veraval, Gujarat"}</p>
        <p>Veraval, Gujarat - 362265</p>
      </div>
    </div>
  );
}

