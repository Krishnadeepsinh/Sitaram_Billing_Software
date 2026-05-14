import { QRCodeCanvas } from "qrcode.react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { numberToWords } from "@/lib/utils";

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

export function InvoiceTotals({ brand, invoice, invoices = [], payments = [] }: InvoiceTotalsProps) {
  const previousDues = (invoices || [])
    .filter((item) => item.subscriberId === invoice.subscriberId && item.id !== invoice.id && item.status !== "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  const totalPayable = Number(invoice?.amount || 0);
  const discount = Number(invoice?.discount || 0);
  const grossTotal = totalPayable + discount;
  const grandTotal = totalPayable + previousDues;
  
  const linkedPayments = (payments || [])
    .filter((payment) => payment.invoiceId === invoice.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const hasUpiId = Boolean(String(brand.upiId || "").trim());

  return (
    <div className="space-y-4">
      <div className="flex gap-10 mt-2 items-start">
        {/* Left Side: QR */}
        <div className="w-[180px] shrink-0">
          <div className="bg-slate-50 p-5 rounded-3xl text-center border border-slate-100 flex flex-col items-center shadow-md">
            <p className="text-[10px] font-black text-[#1e3a5f] mb-4 uppercase tracking-[0.2em]">Scan to Pay (UPI)</p>
            {hasUpiId ? (
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100">
                <QRCodeCanvas
                  value={`upi://pay?pa=${brand.upiId}&pn=${encodeURIComponent(brand.name)}&am=${grandTotal.toFixed(2)}&cu=INR`}
                  size={120}
                  bgColor="#ffffff"
                  fgColor="#1e3a5f"
                  level="H"
                  includeMargin={false}
                />
              </div>
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-400 italic">
                UPI ID Not Available
              </div>
            )}
            <p className="text-[10px] font-black text-slate-500 mt-4 font-mono tracking-tighter truncate w-full px-1">{brand.upiId}</p>
          </div>
        </div>

        {/* Right Side: Simple Financial Summary */}
        <div className="flex-1 pt-2">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest text-[11px] px-1 pt-1 border-t border-slate-100">
              <span>Invoice Amount</span>
              <span className="text-slate-900 font-black">₹{totalPayable.toFixed(2)}</span>
            </div>

            {previousDues > 0 && (
              <div className="flex justify-between items-center text-amber-600 font-bold uppercase tracking-widest text-[11px] px-1">
                <span>Previous Balance</span>
                <span>₹{previousDues.toFixed(2)}</span>
              </div>
            )}

            <div className="bg-[#1e3a5f] rounded-3xl p-5 flex justify-between items-center text-white shadow-lg relative overflow-hidden mt-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex flex-col relative z-10">
                <span className="font-black text-[9px] uppercase tracking-[0.3em] text-orange-300">Final Amount Payable</span>
                <div className="mt-1 h-1 w-10 bg-orange-50 rounded-full" />
              </div>
              <div className="text-right relative z-10">
                <span className="font-black text-3xl text-white tracking-tighter">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="px-1 pt-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total in Words</p>
              <p className="text-[11px] font-black text-[#1e3a5f] uppercase italic leading-tight">
                Rupees {numberToWords(grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {linkedPayments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Recent Receipt History</p>
          <div className="grid grid-cols-2 gap-3">
            {linkedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/50"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-700">{formatDate(payment.date)}</span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{payment.method}</span>
                </div>
                <span className="text-sm font-black text-emerald-700">₹{payment.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
