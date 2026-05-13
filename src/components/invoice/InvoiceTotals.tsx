import { QRCodeCanvas } from "qrcode.react";
import { formatCurrency, formatDate } from "@/lib/mockData";

type InvoiceTotalsProps = {
  brand: {
    name: string;
    upiId: string;
    phone: string;
  };
  invoice: any;
  invoices: any[];
  payments: any[];
};

export function InvoiceTotals({ brand, invoice, invoices, payments }: InvoiceTotalsProps) {
  const previousDues = invoices
    .filter((item) => item.subscriberId === invoice.subscriberId && item.id !== invoice.id && item.status !== "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const currentAmount = Number(invoice.amount || 0) + Number(invoice.discount || 0);
  const linkedPayments = payments
    .filter((payment) => payment.invoiceId === invoice.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const hasUpiId = Boolean(String(brand.upiId || "").trim());

  return (
    <>
      <div className="flex gap-6 mt-4">
        <div className="w-64 bg-slate-50 p-4 rounded text-center border border-slate-100 flex flex-col items-center">
          <p className="text-xs font-bold text-[#1e3a5f] mb-2">SCAN TO PAY (UPI)</p>
          {hasUpiId ? (
            <>
              <QRCodeCanvas
                value={`upi://pay?pa=${brand.upiId}&pn=${encodeURIComponent(brand.name)}&am=${invoice.amount}&cu=INR`}
                size={120}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                includeMargin={false}
              />
              <p className="text-xs text-slate-500 mt-2">{brand.upiId}</p>
            </>
          ) : (
            <div className="flex h-[120px] w-[120px] items-center justify-center rounded border border-dashed border-slate-300 bg-white px-3 text-[11px] font-medium text-slate-500">
              UPI ID not configured
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end gap-3">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">{invoice.type === "legacy" ? "Legacy Amount" : "Current Plan Charge"}</span>
              <span className="font-bold text-slate-700">Rs. {currentAmount.toFixed(2)}</span>
            </div>

            {previousDues > 0 && (
              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                <span className="text-amber-600 font-bold">Arrears / Previous Year Due</span>
                <span className="font-bold text-amber-700">Rs. {previousDues.toFixed(2)}</span>
              </div>
            )}

            {Number(invoice.discount || 0) > 0 && (
              <div className="flex justify-between items-center text-sm py-2 border-b border-rose-100">
                <span className="text-rose-500 font-bold italic">Discount Applied</span>
                <span className="font-bold text-rose-600">- Rs. {Number(invoice.discount).toFixed(2)}</span>
              </div>
            )}

            <div className="bg-[#1e3a5f] rounded-xl p-4 flex justify-between items-center text-white mt-2 shadow-inner ring-1 ring-white/10">
              <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase tracking-widest text-blue-200">Grand Total Payable</span>
                <span className="text-[9px] text-blue-300 italic">Net amount after adjustments</span>
              </div>
              <div className="text-right">
                <span className="font-black text-2xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  Rs. {(Number(invoice.amount || 0) + previousDues).toFixed(2)}
                </span>
              </div>
            </div>

            {linkedPayments.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Timeline</p>
                </div>
                <div className="space-y-2">
                  {linkedPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 group hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-800">{formatDate(payment.date)}</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{payment.method} Payment</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="text-sm font-black text-emerald-700">{formatCurrency(payment.amount)}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Recpt: {payment.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 mt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Total Amount Received</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(linkedPayments.reduce((sum, payment) => sum + payment.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mt-auto mb-4">
        <p className="text-orange-500 font-bold text-xs mb-2">IMPORTANT REMINDERS</p>
        <ul className="text-xs text-slate-700 space-y-1">
          <li>Pay before {formatDate(invoice.dueDate)} to avoid service interruption.</li>
          <li>For support call: {brand.phone}</li>
          <li>Retain this receipt for your records.</li>
        </ul>
      </div>
    </>
  );
}
