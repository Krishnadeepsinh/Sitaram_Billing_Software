type InvoiceCustomerBlockProps = {
  subscriber: any;
  customerIdLabel: string;
};

export function InvoiceCustomerBlock({ subscriber, customerIdLabel }: InvoiceCustomerBlockProps) {
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

  return (
    <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col">
      <p className="text-orange-500 text-[10px] font-black mb-3 uppercase tracking-widest">Billed To Customer</p>
      <h2 className="text-2xl font-black text-slate-900 mb-3 leading-tight tracking-tight">
        <span className="text-primary mr-2 opacity-50">#{subscriber?.customerNo || "—"}</span>
        {subscriber?.name || "Valued Customer"}
      </h2>
      <div className="text-sm text-slate-600 space-y-1 leading-relaxed flex-1">
        {addressLines.length > 0 ? (
          addressLines.map((line) => (
            <p key={line} className="font-medium">{line}</p>
          ))
        ) : (
          <p className="italic text-slate-400">Address not provided</p>
        )}
        <p className="font-medium">Bhavnagar, Gujarat</p>
        <div className="mt-4 space-y-1 pt-3 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 w-24 tracking-tighter">{customerIdLabel}:</span>
            <span className="text-sm font-black text-primary">{customerIdValue || "-"}</span>
          </div>
          {username && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 w-24 tracking-tighter">Username:</span>
              <span className="text-sm font-bold text-slate-800">{username}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 w-24 tracking-tighter">Mobile:</span>
              <span className="text-sm font-bold text-slate-800">+91 {phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
