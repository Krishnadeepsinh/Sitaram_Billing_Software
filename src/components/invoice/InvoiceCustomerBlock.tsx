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
  const username = String(subscriber?.customerUsername || "").trim();
  const customerNo = subscriber?.customerNo || "-";

  return (
    <div className="flex-[0.6] bg-[#F4F7FB] p-[5mm] rounded-[4mm] border border-[#DDE4EF] flex flex-col h-[45mm]">
      <p className="text-[#F47920] text-[7pt] font-black mb-3 uppercase tracking-widest">BILLED TO CUSTOMER</p>
      
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10pt] font-black text-[#1E293B]">#{customerNo}</span>
        <h2 className="text-[13pt] font-bold text-[#1E293B] tracking-tight truncate">
          {subscriber?.name || "Valued Customer"}
        </h2>
      </div>

      <div className="text-[8.5pt] text-[#64748B] space-y-0.5 leading-tight flex-1">
        {addressLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p>Bhavnagar, Gujarat</p>
      </div>

      <div className="mt-2 flex gap-6 pt-2 border-t border-[#DDE4EF]">
        {customerIdValue && customerIdValue !== "-" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[7.5pt] font-black uppercase text-[#94A3B8] tracking-tighter">{isCableMode ? "STB:" : "ID:"}</span>
            <span className="text-[8.5pt] font-bold text-[#1E293B]">{customerIdValue}</span>
          </div>
        )}
        {phone && phone !== "N/A" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[7.5pt] font-black uppercase text-[#94A3B8] tracking-tighter">MOBILE:</span>
            <span className="text-[8.5pt] font-bold text-[#1E293B]">{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
