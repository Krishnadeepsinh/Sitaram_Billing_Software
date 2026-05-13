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

  return (
    <div className="flex-1 bg-slate-50 p-6 rounded border border-slate-100">
      <p className="text-orange-500 text-xs font-bold mb-3 uppercase">Billed To</p>
      <h2 className="text-xl font-bold text-slate-900 mb-3 leading-tight tracking-tight">
        {subscriber?.name || "Customer"}
      </h2>
      <div className="text-sm text-slate-600 space-y-1.5 leading-relaxed">
        {addressLines.length > 0 ? (
          addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))
        ) : (
          <p className="italic text-slate-500">Address not available</p>
        )}
        <p className="font-bold text-primary pt-1">
          {customerIdLabel}: {customerIdValue || "Not available"}
        </p>
        {phone && <p>Mobile: {phone}</p>}
      </div>
    </div>
  );
}
