import { QRCodeSVG } from "qrcode.react";
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
    .reduce((sum, item) => sum + (Number(String(item.amount).replace(/[^0-9.]/g, '')) || 0), 0);
  
  const totalPayable = Number(String(invoice?.amount || 0).replace(/[^0-9.]/g, ''));
  const discount = Number(String(invoice?.discount || 0).replace(/[^0-9.]/g, ''));
  const grossTotal = (totalPayable || 0) + (discount || 0);
  const grandTotal = (totalPayable || 0) + previousDues;
  
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {/* QR Card */}
        <div className="w-[45mm] bg-[#F4F7FB] border border-[#DDE4EF] rounded-[4mm] p-6 flex flex-col items-center min-h-[48mm]">
          <p className="text-[#1B2B4B] text-[7px] font-black uppercase tracking-[0.2em] mb-4">SCAN TO PAY</p>
          <div className="p-2 bg-white rounded-[3mm] mb-4">
            <QRCodeSVG
              value={`upi://pay?pa=${brand.upiId}&pn=${encodeURIComponent(brand.name)}&am=${grandTotal.toFixed(2)}&cu=INR`}
              size={110}
              bgColor="#ffffff"
              fgColor="#1B2B4B"
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[#64748B] text-[6px] font-bold">{brand.upiId}</p>
        </div>

        {/* Totals Card */}
        <div className="flex-1 bg-[#F4F7FB] border border-[#DDE4EF] rounded-[4mm] p-6 flex flex-col justify-between min-h-[48mm]">
          <div>
            <p className="text-[#94A3B8] text-[7.5px] font-bold uppercase mb-4">BILLING SUMMARY</p>
            <div className="h-[1px] bg-[#DDE4EF] mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[8.5px]">
                <span className="text-[#64748B]">Current Plan Charges</span>
                <span className="text-[#1E293B] font-bold">Rs. {grossTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[8.5px]">
                <span className="text-[#64748B]">Previous Outstanding</span>
                <span className="text-[#1E293B] font-bold">Rs. {previousDues.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[8.5px]">
                <span className="text-[#64748B]">Taxes (GST 0%)</span>
                <span className="text-[#1E293B] font-bold">Rs. 0.00</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1B2B4B] rounded-[3mm] p-4 flex justify-between items-center">
            <span className="text-white text-[10px] font-black">NET PAYABLE AMOUNT</span>
            <span className="text-white text-[12px] font-black">Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-[4mm] px-8 py-4 flex items-center gap-6">
        <span className="text-[#F47920] text-[7px] font-black uppercase">AMOUNT IN WORDS</span>
        <span className="text-[9px] font-black text-[#1E293B] uppercase">
          {numberToWords(Math.round(grandTotal))} Rupees Only
        </span>
      </div>
    </div>
  );
}

