import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X, CheckCircle2, ShieldCheck, CreditCard, Activity, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatFullDate } from "@/lib/mockData";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type PaymentReceiptModalProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
    upiId: string;
    gstin?: string;
  };
  customerIdLabel: string;
  payment: any;
  subscribers: any[];
  onClose: () => void;
  isCableMode: boolean;
  plans: any[];
  invoices: any[];
  payments: any[];
};

export default function PaymentReceiptModal({
  brand,
  customerIdLabel,
  payment,
  subscribers,
  onClose,
  isCableMode,
  plans,
  invoices,
  payments,
}: PaymentReceiptModalProps) {
  if (!payment) return null;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(1122);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 48;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      setScale(newScale);
      setTimeout(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      }, 100);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const subscriber = useMemo(
    () => subscribers.find((item) => item.id === payment.subscriberId),
    [payment.subscriberId, subscribers],
  );

  const generatePdfBlob = async () => {
    const element = document.getElementById("receipt-content-print");
    if (!element) throw new Error("Document not ready");

    const parent = element.parentElement;
    const originalParentStyle = parent ? parent.getAttribute("style") : "";
    
    if (parent) {
      parent.style.display = "block";
      parent.style.position = "fixed";
      parent.style.top = "0";
      parent.style.left = "-10000px";
      parent.style.width = "794px";
      parent.style.zIndex = "-9999";
    }

    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // Give more time for the off-screen element to layout properly
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 1.5, 
        backgroundColor: "#ffffff",
        cacheBust: true,
        style: {
          visibility: "visible",
          display: "block",
        }
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      
      if (parent) parent.setAttribute("style", originalParentStyle || "display: none");
      return pdf.output("blob");
    } catch (err) {
      console.error("PDF Gen Error:", err);
      if (parent) parent.setAttribute("style", originalParentStyle || "display: none");
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const blob = await generatePdfBlob();
      const { saveAs } = await import("file-saver");
      saveAs(blob, `Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    setIsProcessing(true);
    try {
      const pdfBlob = await generatePdfBlob();
      const fileName = `Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*PAYMENT RECEIPT*\nHello ${subscriber?.name || "Customer"},\nThank you for your payment of *Rs. ${payment.amount}*.\nRef: ${payment.id.slice(-6).toUpperCase()}\nDate: ${formatFullDate(payment.date)}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Receipt ${payment.id.slice(-6).toUpperCase()}`, text: message });
      } else {
        const { saveAs } = await import("file-saver");
        saveAs(pdfBlob, fileName);
        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success("Receipt downloaded & WhatsApp opened");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not share PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const ReceiptContent = ({ id }: { id?: string }) => {
    const parseAmount = (val: any) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const cleaned = String(val || '0').replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const amount = parseAmount(payment?.amount);
    
    const numToWords = (n: number) => {
      if (isNaN(n)) return "Zero Rupees Only";
      const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
      const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      const helper = (num: number): string => {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? " " + ones[num%10] : "");
        if (num < 1000) return ones[Math.floor(num/100)] + " Hundred" + (num%100 ? " " + helper(num%100) : "");
        if (num < 100000) return helper(Math.floor(num/1000)) + " Thousand" + (num%1000 ? " " + helper(num%1000) : "");
        return helper(Math.floor(num/100000)) + " Lakh" + (num%100000 ? " " + helper(num%100000) : "");
      };
      const result = helper(Math.floor(n));
      return result ? result + " Rupees Only" : "Zero Rupees Only";
    };

    return (
      <div 
        id={id}
        className="bg-white relative font-sans flex flex-col min-h-[1122px] w-[794px] shrink-0 overflow-hidden"
        style={{ color: "#1E293B" }}
      >
        {/* 1. PROFESSIONAL HEADER SECTION */}
        <div className="bg-[#1A3C6E] p-12 flex justify-between items-start relative overflow-hidden h-[180px]">
          <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-60px] right-40 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#0EA5E9]" />

          <div className="flex gap-12 relative z-10 items-center">
            <div className="bg-white p-4 rounded-3xl w-[45mm] h-[45mm] flex items-center justify-center shadow-2xl border border-white/20">
              <img src="/logo.png" alt="Sitaram Logo" className="w-full h-auto object-contain" />
            </div>

            <div className="text-white flex flex-col justify-center">
              <h1 className="text-[28px] font-black tracking-tighter leading-none mb-1">{brand.name}</h1>
              <p className="text-[11px] text-blue-300 font-bold mb-6 tracking-[0.25em] uppercase opacity-90">Connecting Every Home • Fast & Reliable</p>
              
              <div className="space-y-1.5 opacity-90">
                <p className="text-[10px] flex items-center gap-2">📞 +91 98765 43210  |  📞 +91 91234 56789</p>
                <p className="text-[10px]">📍 {brand.address || "Shop No. 5, Main Market, Veraval, Gujarat - 362265"}</p>
                <p className="text-[10px] font-bold text-blue-300">WhatsApp Support: +91 98765 43210</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end relative z-10 pt-4">
            <div className="bg-[#16A34A] px-12 py-4 rounded-2xl shadow-[0_15px_35px_rgba(22,163,74,0.4)] border-2 border-white/30">
              <span className="text-white text-[18px] font-black uppercase tracking-[0.3em]">RECEIPT</span>
            </div>
            <p className="text-white/50 text-[10px] font-bold mt-4 tracking-widest uppercase">Payment Confirmation</p>
          </div>
        </div>

        <div className="h-3 bg-[#16A34A] relative overflow-hidden">
           <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>

        <div className="p-12 space-y-10 flex-1">
          {/* 2. TRANSACTION SUMMARY GRID */}
          <div className="bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-[6mm] px-12 py-8 grid grid-cols-4 gap-10 shadow-sm relative">
            <div className="absolute top-0 left-10 transform -translate-y-1/2 bg-white px-4 py-1 rounded-full border border-emerald-100 shadow-sm">
               <span className="text-[#16A34A] text-[8px] font-black uppercase tracking-widest">Transaction Details</span>
            </div>
            {[
              { label: "Receipt No:", val: `REC-${payment.id.slice(-6).toUpperCase()}` },
              { label: "Payment Date:", val: formatFullDate(payment.date) },
              { label: "Payment Mode:", val: payment.method || "ONLINE / UPI" },
              { label: "Status:", val: "SUCCESSFUL", color: "text-[#16A34A]" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[#64748B] text-[9px] font-black uppercase tracking-widest mb-1.5">{item.label}</span>
                <span className={`text-[12px] font-black ${item.color || "text-[#1E293B]"}`}>{item.val}</span>
              </div>
            ))}
          </div>

          {/* 3. CUSTOMER & SERVICE PANEL */}
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6mm] overflow-hidden flex flex-col shadow-sm">
              <div className="bg-[#1A3C6E] px-8 py-4 flex items-center justify-between">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">CUSTOMER INFORMATION</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 opacity-50" />
              </div>
              <div className="p-8 space-y-4 flex-1 bg-white">
                {[
                  { label: "Full Name:", val: subscriber?.name || "N/A" },
                  { label: "Customer ID:", val: subscriber?.customerId || subscriber?.id || "N/A" },
                  { label: "Mobile No:", val: subscriber?.phone || "N/A" },
                  { label: "Service Type:", val: isCableMode ? "Digital Cable TV" : "Broadband - Fiber Optic" },
                  { label: "Transaction ID:", val: payment.id.toUpperCase() }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-5 text-[11px] items-center border-b border-slate-50 pb-2">
                    <span className="col-span-2 text-[#64748B] font-bold">{row.label}</span>
                    <span className="col-span-3 text-[#1E293B] font-black truncate">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6mm] overflow-hidden flex flex-col shadow-sm">
              <div className="bg-[#1A3C6E] px-8 py-4">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">SERVICE ADDRESS</span>
              </div>
              <div className="p-8 space-y-8 flex-1 bg-white">
                <p className="text-[12px] text-[#1E293B] font-bold leading-relaxed">
                  {subscriber?.area || "House No. 12, Patel Colony, Near Ram Mandir"},<br />
                  Veraval, Gujarat - 362265
                </p>
                <div className="bg-[#EFF6FF] border-2 border-blue-100 px-6 py-4 rounded-3xl flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3B82F6]" />
                  <span className="text-[#1A3C6E] text-[10px] font-black uppercase tracking-widest">Zone: {subscriber?.towerId || "Zone-B | Tower: VRW-02"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. PAYMENT BREAKDOWN TABLE */}
          <div className="rounded-[6mm] border-2 border-[#1A3C6E]/10 overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A3C6E] text-white">
                  <th className="px-8 py-5 text-[10px] font-black uppercase w-20 border-r border-white/10 text-center">ITEM</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase border-r border-white/10">DESCRIPTION</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase border-r border-white/10 text-center">TRANSACTION REF</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase text-right">PAID AMOUNT</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                <tr className="bg-white border-b border-[#E2E8F0]">
                  <td className="px-8 py-6 text-center text-[#64748B] font-black border-r border-[#E2E8F0]">01</td>
                  <td className="px-8 py-6 text-[#1E293B] font-black border-r border-[#E2E8F0]">
                    <p>{isCableMode ? "Digital Cable TV Subscription" : "High-Speed Broadband Subscription"}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Service Renewal Payment</p>
                  </td>
                  <td className="px-8 py-6 text-[#1E293B] font-bold text-center border-r border-[#E2E8F0]">{payment.id.slice(-10).toUpperCase()}</td>
                  <td className="px-8 py-6 text-right text-[#16A34A] font-black bg-emerald-50/30">Rs. {amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. RECEIPT SUMMARY */}
          <div className="flex justify-between items-start pt-4">
             <div className="flex-1 pr-12">
                <p className="text-[10px] text-[#64748B] font-black uppercase tracking-widest mb-2 opacity-50">Amount In Words</p>
                <p className="text-[12px] text-[#16A34A] font-black uppercase leading-tight bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                   {numToWords(amount)}
                </p>
             </div>

            <div className="w-[90mm] space-y-3">
              <div className="flex justify-between items-center text-[12px] px-4">
                <span className="text-[#64748B] font-bold">Base Payment:</span>
                <span className="text-[#1E293B] font-black">Rs. {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[12px] px-4">
                <span className="text-[#64748B] font-bold">Other Charges:</span>
                <span className="text-[#1E293B] font-black">Rs. 0.00</span>
              </div>
              <div className="bg-[#16A34A] rounded-[5mm] p-6 flex justify-between items-center shadow-2xl border-t-8 border-emerald-300">
                <span className="text-white text-[14px] font-black tracking-[0.25em] uppercase">TOTAL RECEIVED</span>
                <div className="flex flex-col items-end">
                  <span className="text-white text-[22px] font-black">Rs. {amount.toFixed(2)}</span>
                  <span className="text-emerald-100 text-[8px] font-black uppercase tracking-widest mt-1">Payment Successful</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. VERIFICATION & SECURITY */}
          <div className="grid grid-cols-12 gap-10 pt-8">
            <div className="col-span-8 bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-[6mm] p-10 shadow-sm relative">
              <h3 className="text-[#16A34A] text-[12px] font-black uppercase tracking-[0.25em] mb-8 flex items-center gap-4">
                <div className="w-2 h-8 bg-[#16A34A] rounded-full" />
                SECURITY VERIFICATION
              </h3>
              <div className="space-y-4 text-[11px] text-[#14532D] font-bold leading-relaxed">
                <p>This digital receipt serves as official proof of payment. For your security, always ensure the transaction details match your bank/UPI statement.</p>
                <div className="flex items-center gap-6 bg-white/60 p-5 rounded-2xl border-2 border-emerald-100 shadow-sm">
                   <div className="h-14 w-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl border-4 border-white">
                      <ShieldCheck className="h-8 w-8" />
                   </div>
                   <div>
                      <p className="text-[#064E3B] font-black tracking-tight">TRANSACTION SECURE & VERIFIED</p>
                      <p className="text-[10px] opacity-70">Payment processed by Sitaram Cable & Broadband Cloud Systems</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="col-span-4 bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-[6mm] p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
              <span className="text-[#1A3C6E] text-[11px] font-black uppercase tracking-[0.2em] mb-6">TRANSACTION QR</span>
              <div className="bg-white p-5 rounded-[8mm] shadow-2xl border-4 border-white mb-6 relative group transition-transform hover:scale-105">
                <QRCodeSVG
                  value={`TRANSACTION_ID:${payment.id}|AMOUNT:${amount}|DATE:${payment.date}`}
                  size={140}
                  level="H"
                />
              </div>
              <span className="text-[#1A3C6E] text-[10px] font-black tracking-widest bg-white px-5 py-2.5 rounded-full border-2 border-blue-100 shadow-lg">
                SITARAM SECURE
              </span>
            </div>
          </div>

          {/* Signature Area */}
          <div className="flex justify-between items-end pt-12 border-t-2 border-slate-50">
             <div className="text-[10px] text-slate-400 font-bold max-w-xs">
                <p>Note: This is a computer-generated digital receipt and does not require a physical signature. Please retain for future reference.</p>
             </div>
             <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-48 border-b-2 border-slate-200 flex items-end justify-center pb-2 opacity-50 italic text-[11px] text-slate-400">
                   Sitaram Billing System
                </div>
                <span className="text-[#1A3C6E] text-[11px] font-black uppercase tracking-widest">Authorized Signatory</span>
             </div>
          </div>
        </div>

        {/* 7. BRAND FOOTER */}
        <div className="bg-[#1A3C6E] py-6 px-12 flex items-center justify-between">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.25em]">
            Official Digital Receipt • {brand.name}
          </p>
          <div className="flex gap-8 items-center text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">
             <ShieldCheck className="h-4 w-4 text-emerald-400" />
             <span>Transaction Secured</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative z-10 max-h-[96vh]">
        {/* Preview Header */}
        <div className="px-10 py-6 bg-white flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1B2B4B]">Digital Receipt Preview</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction Confirmed</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-all group">
            <X className="h-6 w-6 text-slate-300 group-hover:text-slate-900" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-[#EDF1F7] flex justify-center p-12 scrollbar-hide">
          <div 
            ref={contentRef}
            className="origin-top transition-all duration-500 ease-out shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * contentHeight}px`,
            }}
          >
            <ReceiptContent id="receipt-content" />
          </div>
        </div>

        {/* Hidden Container for PDF Generation */}
        <div style={{ display: "none" }}>
          <ReceiptContent id="receipt-content-print" />
        </div>

        {/* Action Bar */}
        <div className="p-10 bg-white border-t border-slate-100 flex gap-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="h-16 px-10 rounded-2xl font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 hover:text-slate-900 border-slate-200"
          >
            Close Preview
          </Button>
          <div className="flex-1 flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleSharePDF} 
              disabled={isProcessing}
              className="flex-1 h-16 rounded-2xl font-black text-emerald-600 uppercase tracking-[0.2em] text-[10px] bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50 transition-all flex gap-3 items-center justify-center"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} 
              Share via WhatsApp
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              disabled={isProcessing}
              className="flex-1 h-16 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-[10px] bg-[#1B2B4B] hover:bg-[#243352] shadow-xl shadow-slate-200 transition-all flex gap-3 items-center justify-center"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />} 
              Download Digital Receipt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
