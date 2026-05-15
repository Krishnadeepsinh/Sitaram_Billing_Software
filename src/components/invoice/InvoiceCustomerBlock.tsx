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
  const customerNo = subscriber?.customerNo || subscriber?.customerId || subscriber?.code || "-";

  return (
    <div className="flex-[0.6] bg-[#F4F7FB] p-[5mm] rounded-[4mm] border border-[#DDE4EF] flex flex-col h-[45mm] relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <div className="absolute top-0 right-0 w-[12mm] h-[12mm] bg-orange-500/5 rounded-full -mr-[4mm] -mt-[4mm] blur-xl" />
      
      <div className="flex justify-between items-start mb-3">
        <p className="text-[#F47920] text-[7pt] font-black uppercase tracking-widest">BILLED TO CUSTOMER</p>
        <div className="bg-[#1B2B4B] px-2 py-0.5 rounded-full">
           <span className="text-white text-[6pt] font-black uppercase tracking-tighter">Verified Account</span>
        </div>
      </div>
      
      <div className="flex flex-col mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[9pt] font-black text-[#64748B] opacity-50">#</span>
          <span className="text-[11pt] font-black text-[#1B2B4B]">{customerNo}</span>
        </div>
        <h2 className="text-[14pt] font-bold text-[#1E293B] tracking-tight truncate leading-tight mt-0.5">
          {subscriber?.name || "Valued Customer"}
        </h2>
      </div>

      <div className="text-[8.5pt] text-[#64748B] space-y-0.5 leading-[1.3] flex-1 font-medium">
        <p className="text-[#1E293B]">{addressLines[0] || "No Address Provided"}</p>
        {addressLines[1] && <p className="opacity-80">{addressLines[1]}</p>}
        <p className="text-[7.5pt] font-bold text-[#1B2B4B] uppercase tracking-wide mt-1">
          {subscriber?.area ? `${subscriber.area}, Bhavnagar, GJ` : "Bhavnagar, Gujarat"}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 pt-3 border-t border-[#DDE4EF] bg-white/40 -mx-[5mm] px-[5mm]">
        {customerIdValue && customerIdValue !== "-" && (
          <div className="flex flex-col">
            <span className="text-[6.5pt] font-black uppercase text-[#94A3B8] tracking-widest">{isCableMode ? "STB NO." : "ID NO."}</span>
            <span className="text-[8.5pt] font-black text-[#1E293B]">{customerIdValue}</span>
          </div>
        )}
        {phone && phone !== "N/A" && (
          <div className="flex flex-col">
            <span className="text-[6.5pt] font-black uppercase text-[#94A3B8] tracking-widest">PHONE NO.</span>
            <span className="text-[8.5pt] font-black text-[#1E293B]">{phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
