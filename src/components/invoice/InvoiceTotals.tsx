import { QRCodeCanvas } from "qrcode.react";
import { numberToWords } from "@/lib/utils";

type InvoiceTotalsProps = {
  brand: {
    name: string;
    upiId: string;
    phone: string;
  };
  invoice: any;
  invoices: any[];
};

export function InvoiceTotals({ brand, invoice, invoices = [] }: InvoiceTotalsProps) {
  const previousDues = (invoices || [])
    .filter((item) => item.subscriberId === invoice.subscriberId && item.id !== invoice.id && item.status !== "paid")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  const totalPayable = Number(invoice?.amount || 0);
  const discount = Number(invoice?.discount || 0);
  const grossTotal = totalPayable + discount;
  const grandTotal = totalPayable + previousDues;
  
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {/* SCAN TO PAY CARD */}
        <div className="w-[180px] bg-[#F4F7FB] p-5 rounded-[1.5rem] border border-[#DDE4EF] flex flex-col items-center">
          <p className="text-[#1B2B4B] text-[8px] font-black uppercase tracking-[0.2em] mb-4">SCAN TO PAY</p>
          <div className="p-3 bg-white rounded-2xl border border-[#DDE4EF] mb-4">
            <QRCodeCanvas
              value={`upi://pay?pa=${brand.upiId}&pn=${encodeURIComponent(brand.name)}&am=${grandTotal.toFixed(2)}&cu=INR`}
              size={110}
              bgColor="#ffffff"
              fgColor="#1B2B4B"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[#64748B] text-[7px] truncate w-full text-center font-bold">{brand.upiId}</p>
        </div>

        {/* BILLING SUMMARY CARD */}
        <div className="flex-1 bg-[#F4F7FB] p-6 rounded-[1.5rem] border border-[#DDE4EF] flex flex-col">
          <p className="text-[#94A3B8] text-[8px] font-black uppercase tracking-[0.2em] mb-4">BILLING SUMMARY</p>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#64748B] font-medium">Current Plan Charges</span>
              <span className="text-[#1E293B] font-black">₹{grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#64748B] font-medium">Previous Outstanding</span>
              <span className="text-[#1E293B] font-black">₹{previousDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#64748B] font-medium">Taxes (GST 0%)</span>
              <span className="text-[#1E293B] font-black">₹0.00</span>
            </div>
          </div>

          <div className="mt-6 bg-[#1B2B4B] p-4 rounded-xl flex justify-between items-center">
            <span className="text-white text-[10px] font-black uppercase tracking-widest">NET PAYABLE AMOUNT</span>
            <span className="text-white text-xl font-black tracking-tight">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="bg-[#FFF7ED] px-8 py-4 rounded-2xl border border-[#FED7AA] flex items-center gap-6">
        <span className="text-[#F47920] text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Amount in Words</span>
        <span className="text-[12px] font-black text-[#1B2B4B] uppercase italic">
          {numberToWords(Math.round(grandTotal))} Rupees Only
        </span>
      </div>
    </div>
  );
}

