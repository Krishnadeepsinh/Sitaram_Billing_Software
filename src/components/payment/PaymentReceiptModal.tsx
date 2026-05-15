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
        {/* 1. TOP NAVY BAND */}
        <div className="bg-[#1A3C6E] p-12 flex justify-between items-start relative overflow-hidden h-[150px]">
          <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-60px] right-40 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#0EA5E9]" />

          <div className="flex gap-10 relative z-10 items-center">
            <div className="bg-white p-4 rounded-2xl w-[40mm] h-[40mm] flex items-center justify-center shadow-2xl border border-white/20">
              <img src="/logo.jpg" alt="Logo" className="w-full h-auto object-contain" />
            </div>

            <div className="text-white flex flex-col justify-center">
              <h1 className="text-[24px] font-black tracking-tight leading-none mb-1">{brand.name}</h1>
              <p className="text-[10px] text-blue-200 font-medium mb-6 tracking-[0.2em] uppercase opacity-80">Connecting Every Home</p>
              
              <div className="space-y-1.5 opacity-90">
                <p className="text-[9px] flex items-center gap-2">📞 +91 98765 43210  |  📞 +91 91234 56789</p>
                <p className="text-[9px]">📍 {brand.address || "Shop No. 5, Main Market, Veraval, Gujarat - 362265"}</p>
                <p className="text-[9px]">💬 WhatsApp Support: +91 98765 43210</p>
                <p className="text-[9px] font-bold text-blue-300">UPI: {brand.upiId}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end relative z-10">
            <div className="bg-[#F47920] px-10 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(244,121,32,0.4)] border border-white/20 mb-4">
              <span className="text-white text-[16px] font-black uppercase tracking-[0.2em]">RECEIPT</span>
            </div>
          </div>
        </div>

        <div className="h-2 bg-[#F47920]" />

        <div className="p-12 space-y-8 flex-1">
          {/* 2. META INFO BAR */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[5mm] px-10 py-6 grid grid-cols-4 gap-8 shadow-sm">
            {[
              { label: "Receipt No:", val: `REC-${payment.id.slice(-6).toUpperCase()}` },
              { label: "Payment Date:", val: formatFullDate(payment.date) },
              { label: "Payment Mode:", val: payment.method || "ONLINE / UPI" },
              { label: "Status:", val: "SUCCESSFUL", color: "text-[#16A34A]" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[#64748B] text-[8px] font-black uppercase tracking-widest mb-1">{item.label}</span>
                <span className={`text-[11px] font-black ${item.color || "text-[#1E293B]"}`}>{item.val}</span>
              </div>
            ))}
          </div>

          {/* 3. TWO-COLUMN PANEL */}
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[5mm] overflow-hidden flex flex-col shadow-sm">
              <div className="bg-[#1A3C6E] px-6 py-3 flex items-center justify-between">
                <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">CUSTOMER INFORMATION</span>
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              </div>
              <div className="p-6 space-y-3.5 flex-1 bg-white">
                {[
                  { label: "Full Name:", val: subscriber?.name || "N/A" },
                  { label: "Customer ID:", val: subscriber?.customerId || subscriber?.id || "N/A" },
                  { label: "Mobile No:", val: subscriber?.phone || "N/A" },
                  { label: "Service Type:", val: isCableMode ? "Digital Cable TV" : "Broadband - Fiber Optic" },
                  { label: "Transaction ID:", val: payment.id.toUpperCase() }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-5 text-[10px] items-center">
                    <span className="col-span-2 text-[#64748B] font-bold">{row.label}</span>
                    <span className="col-span-3 text-[#1E293B] font-black truncate">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[5mm] overflow-hidden flex flex-col shadow-sm">
              <div className="bg-[#1A3C6E] px-6 py-3">
                <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">INSTALLATION ADDRESS</span>
              </div>
              <div className="p-6 space-y-6 flex-1 bg-white">
                <p className="text-[11px] text-[#1E293B] font-bold leading-relaxed">
                  {subscriber?.area || "House No. 12, Patel Colony, Near Ram Mandir"},<br />
                  Veraval, Gujarat - 362265
                </p>
                <div className="bg-[#EFF6FF] border border-blue-100 px-4 py-3 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[#1A3C6E] text-[9px] font-black uppercase">Zone: {subscriber?.towerId || "Zone-B | Tower: VRW-02"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. PAYMENT DETAILS TABLE */}
          <div className="rounded-[5mm] border-2 border-[#1A3C6E]/10 overflow-hidden shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A3C6E] text-white">
                  <th className="px-6 py-4 text-[9px] font-black uppercase w-16 border-r border-white/10 text-center">#</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase border-r border-white/10">Description</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase border-r border-white/10 text-center">Transaction Ref</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-right">Amount Paid (Rs.)</th>
                </tr>
              </thead>
              <tbody className="text-[10.5px]">
                <tr className="bg-white border-b border-[#E2E8F0] hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-center text-[#64748B] font-black border-r border-[#E2E8F0]">1</td>
                  <td className="px-6 py-5 text-[#1E293B] font-black border-r border-[#E2E8F0]">{isCableMode ? "Digital Cable TV Subscription" : "High-Speed Broadband Subscription"}</td>
                  <td className="px-6 py-5 text-[#1E293B] font-bold text-center border-r border-[#E2E8F0]">{payment.id.slice(-10).toUpperCase()}</td>
                  <td className="px-6 py-5 text-right text-[#16A34A] font-black">{amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. TOTALS SECTION */}
          <div className="flex flex-col items-end space-y-3">
            <div className="w-[85mm] space-y-2.5">
              <div className="flex justify-between items-center text-[11px] px-3">
                <span className="text-[#64748B] font-bold">Base Payment:</span>
                <span className="text-[#1E293B] font-black">Rs. {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] px-3">
                <span className="text-[#64748B] font-bold">Taxes / Fees:</span>
                <span className="text-[#1E293B] font-black">Rs. 0.00</span>
              </div>
              <div className="bg-[#16A34A] rounded-[4mm] p-5 flex justify-between items-center shadow-xl border-t-4 border-emerald-300">
                <span className="text-white text-[12px] font-black tracking-[0.2em] uppercase">TOTAL RECEIVED:</span>
                <span className="text-white text-[18px] font-black">Rs. {amount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[9px] text-[#64748B] italic pr-3 mt-4 tracking-wide font-bold">
              Amount In Words: <span className="text-[#16A34A] uppercase">{numToWords(amount)}</span>
            </p>
          </div>

          {/* 6. VERIFICATION & CONFIRMATION SECTION */}
          <div className="grid grid-cols-12 gap-8 pt-6">
            <div className="col-span-8 bg-[#F0FDF4] border-2 border-[#BBF7D0] rounded-[5mm] p-8 shadow-sm">
              <h3 className="text-[#16A34A] text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#16A34A] rounded-full" />
                PAYMENT CONFIRMATION
              </h3>
              <div className="space-y-4 text-[10.5px] text-[#14532D] font-bold">
                <p>This is a computer-generated acknowledgement of the payment received from the customer for SITARAM CABLE & BROADBAND services. No physical signature is required.</p>
                <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-emerald-100">
                   <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg border-2 border-white">
                      <CheckCircle2 className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[#064E3B] font-black">TRANSACTION VERIFIED</p>
                      <p className="text-[9px] opacity-70">Payment ID: {payment.id}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="col-span-4 bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded-[5mm] p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[#1A3C6E] text-[10px] font-black uppercase tracking-[0.2em] mb-6">TRANSACTION QR</span>
              <div className="bg-white p-5 rounded-[6mm] shadow-2xl border-4 border-white mb-6">
                <QRCodeSVG
                  value={`TRANSACTION_ID:${payment.id}|AMOUNT:${amount}|DATE:${payment.date}`}
                  size={135}
                  level="H"
                />
              </div>
              <span className="text-[#1A3C6E] text-[9px] font-black uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-blue-100">
                SITARAM SECURE
              </span>
            </div>
          </div>
        </div>

        {/* 7. BRAND FOOTER */}
        <div className="bg-[#1A3C6E] py-5 px-10 flex items-center justify-between">
          <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">
            Official Digital Receipt • SITARAM CABLE & BROADBAND
          </p>
          <div className="flex gap-6 items-center text-white/80 text-[9px] font-black uppercase tracking-widest">
             <ShieldCheck className="h-4 w-4 text-emerald-400" />
             <span>Secure Transaction</span>
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
