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
    <div className="flex gap-[10mm] mt-[4mm] items-end">
      {/* Left Side: QR & Words */}
      <div className="w-[180px] shrink-0 space-y-4">
        <div className="bg-[#F4F7FB] p-[4mm] rounded-[4mm] border border-[#DDE4EF] flex flex-col items-center shadow-sm">
          <p className="text-[7pt] font-black text-[#1B2B4B] mb-3 uppercase tracking-widest">SCAN TO PAY (UPI)</p>
          <div className="p-2 bg-white rounded-[3mm] border border-[#DDE4EF]">
            <QRCodeCanvas
              value={`upi://pay?pa=${brand.upiId}&pn=${encodeURIComponent(brand.name)}&am=${grandTotal.toFixed(2)}&cu=INR`}
              size={110}
              bgColor="#ffffff"
              fgColor="#1B2B4B"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[6.5pt] font-bold text-[#64748B] mt-3 truncate w-full text-center">{brand.upiId}</p>
        </div>
        
        <div className="px-2">
          <p className="text-[6.5pt] font-black text-[#94A3B8] uppercase tracking-widest mb-1">AMOUNT IN WORDS</p>
          <p className="text-[8pt] font-bold text-[#1B2B4B] uppercase italic leading-tight">
            Rupees {numberToWords(grandTotal)} Only
          </p>
        </div>
      </div>

      {/* Right Side: Financial Summary Table */}
      <div className="flex-1">
        <div className="bg-[#F4F7FB] rounded-[4mm] border border-[#DDE4EF] overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#DDE4EF]">
            <span className="text-[8pt] font-black text-[#94A3B8] uppercase">Subtotal</span>
            <span className="text-[10pt] font-bold text-[#1E293B]">Rs. {grossTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#DDE4EF]">
            <span className="text-[8pt] font-black text-[#94A3B8] uppercase">Discount</span>
            <span className="text-[10pt] font-bold text-[#DC2626]">Rs. {discount.toFixed(2)}</span>
          </div>

          {previousDues > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#DDE4EF] bg-amber-50/50">
              <span className="text-[8pt] font-black text-amber-600 uppercase">Previous Dues</span>
              <span className="text-[10pt] font-bold text-amber-700">Rs. {previousDues.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center px-4 py-5 bg-[#1B2B4B] text-white">
            <div className="flex flex-col">
              <span className="text-[7.5pt] font-black uppercase tracking-[0.2em] text-[#F47920]">Total Amount</span>
              <span className="text-[6pt] opacity-60">Inclusive of all services</span>
            </div>
            <span className="text-[20pt] font-black text-white tracking-tighter">
              Rs. {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>

      {linkedPayments.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[#DDE4EF] relative">
          <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 bg-white px-4 text-[7pt] font-black text-[#94A3B8] uppercase tracking-[0.3em]">
            Payment Reconciliation
          </div>
          <div className="grid grid-cols-2 gap-4">
            {linkedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center bg-[#F4F7FB] p-4 rounded-[3mm] border border-[#DDE4EF] hover:border-[#1B2B4B] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[9pt] font-black text-[#1B2B4B]">{formatDate(payment.date)}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    <span className="text-[7pt] font-bold text-[#64748B] uppercase tracking-widest">{payment.method}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10pt] font-black text-[#1B2B4B]">Rs. {payment.amount}</span>
                  <p className="text-[6pt] text-[#16A34A] font-bold uppercase tracking-tighter">Success</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center py-4 border-y border-[#DDE4EF] border-dashed">
        <p className="text-[8pt] font-bold text-[#1B2B4B] uppercase tracking-[0.1em]">
          Thank you for your business! We appreciate your timely payments.
        </p>
        <p className="text-[6.5pt] text-[#64748B] mt-1 italic">
          For any billing queries, please contact our support at {brand.phone}
        </p>
      </div>
    </div>
  );
}
