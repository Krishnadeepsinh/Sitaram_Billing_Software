import { QRCodeCanvas } from "qrcode.react";
import { formatDate } from "@/lib/mockData";
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

  return (
    <div className="space-y-10">
      <div className="flex gap-10 mt-6 items-end">
        {/* Left Side: QR & Words */}
        <div className="w-[180px] shrink-0 space-y-6">
          <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm relative group">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl -z-10" />
            <p className="text-[8px] font-black text-slate-400 mb-4 uppercase tracking-[0.25em]">Payment QR (UPI)</p>
            <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-100">
              <QRCodeCanvas
                value={`upi://pay?pa=${brand.upiId}&pn=${encodeURIComponent(brand.name)}&am=${grandTotal.toFixed(2)}&cu=INR`}
                size={110}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-[8px] font-black text-[#F47920] mt-4 truncate w-full text-center tracking-tighter bg-orange-50 px-2 py-1 rounded-full">{brand.upiId}</p>
          </div>
          
          <div className="px-1">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Amount in words</p>
            <p className="text-[10px] font-black text-slate-900 uppercase italic leading-tight">
              {numberToWords(grandTotal)} Only
            </p>
          </div>
        </div>

        {/* Right Side: Financial Summary Table */}
        <div className="flex-1">
          <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100/60">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
              <span className="text-sm font-black text-slate-900 tracking-tighter">₹{grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100/60">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount</span>
              <span className="text-sm font-black text-rose-500 tracking-tighter">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            {previousDues > 0 && (
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100/60 bg-orange-50/30">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Previous Balance</span>
                <span className="text-sm font-black text-orange-600 tracking-tighter">₹{previousDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between items-center px-6 py-8 bg-[#0f172a] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-400 mb-1">Grand Total</span>
                <span className="text-[10px] font-bold text-slate-400 opacity-60 uppercase tracking-widest">Inclusive of taxes & fees</span>
              </div>
              <span className="text-3xl font-black text-white tracking-tighter relative z-10">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {linkedPayments.length > 0 && (
        <div className="mt-10 pt-8 border-t border-slate-100 relative">
          <div className="absolute -top-[11px] left-8 bg-white px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Reconciliation Records
          </div>
          <div className="grid grid-cols-2 gap-4">
            {linkedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center bg-slate-50/50 p-5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-slate-900">{formatDate(payment.date)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{payment.method}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col gap-1">
                  <span className="text-sm font-black text-[#0f172a] tracking-tight">₹{Number(payment.amount).toLocaleString('en-IN')}</span>
                  <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">Confirmed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-center py-6 border-y border-slate-100 border-dashed mt-8">
        <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em]">
          Thank you for your continued partnership with {brand.name}
        </p>
      </div>
    </div>
  );
}
