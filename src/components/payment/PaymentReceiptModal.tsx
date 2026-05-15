import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X, CheckCircle2, ShieldCheck, CreditCard, Transaction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mockData";
import { toast } from "sonner";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceCustomerBlock } from "../invoice/InvoiceCustomerBlock";
import { numberToWords } from "@/lib/utils";

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

  const generatePreviewPdfBlob = async () => {
    const element = document.getElementById("receipt-content-print");
    if (!element) throw new Error("Receipt document not ready.");
    
    // Position hiddenly for high-res capture
    element.style.display = "block";
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";

    const html2pdf = (await import("html2pdf.js")).default;
    const options = {
      margin: 0,
      filename: `Sitaram_Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        windowWidth: 794 
      },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    try {
      const blob = await html2pdf().set(options).from(element).toPdf().output("blob");
      element.style.display = "none";
      return blob;
    } catch (err) {
      element.style.display = "none";
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const { saveAs } = await import("file-saver");
      const blob = await generatePreviewPdfBlob();
      saveAs(blob, `Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`);
      toast.success("Professional Receipt downloaded");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    setIsProcessing(true);
    try {
      const { saveAs } = await import("file-saver");
      const pdfBlob = await generatePreviewPdfBlob();
      const fileName = `Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*PAYMENT RECEIPT: ${payment.id.slice(-6).toUpperCase()}*\nHello ${subscriber?.name || "Customer"},\nThank you for your payment of *Rs. ${payment.amount}*.\nDate: ${formatDate(payment.date)}\nMethod: ${payment.method}\n\nThank you for choosing ${brand.name}!`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Payment Receipt", text: message });
      } else {
        saveAs(pdfBlob, fileName);
        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success("Receipt downloaded & WhatsApp opened");
      }
    } catch (error) {
      toast.error("Could not share receipt");
    } finally {
      setIsProcessing(false);
    }
  };

  const ReceiptContent = ({ id }: { id?: string }) => (
    <div 
      id={id}
      className="bg-white relative font-sans flex flex-col min-h-[1122px] w-[794px] shrink-0"
    >
      <InvoiceHeader brand={brand} invoiceLabel="PAYMENT RECEIPT" />

      <div className="p-12 space-y-8 flex-1 flex flex-col">
        {/* Receipt Meta Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "RECEIPT NO.", value: `REC-${payment.id.slice(-6).toUpperCase()}`, icon: ShieldCheck, color: "text-[#1B2B4B]", bg: "bg-[#F4F7FB]" },
            { label: "PAYMENT DATE", value: formatDate(payment.date), icon: CheckCircle2, color: "text-[#1B2B4B]", bg: "bg-[#F4F7FB]" },
            { label: "METHOD", value: payment.method, icon: CreditCard, color: "text-white", bg: "bg-[#1B2B4B]" },
            { label: "STATUS", value: "SUCCESSFUL", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" }
          ].map((card, i) => (
            <div key={i} className={`p-6 rounded-[1.5rem] flex flex-col gap-2 border border-black/5 shadow-sm ${card.bg}`}>
              <div className="flex justify-between items-center">
                <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${i === 2 ? 'text-white/40' : 'text-[#94A3B8]'}`}>{card.label}</span>
                <card.icon className={`h-3 w-3 ${i === 2 ? 'text-[#F47920]' : card.color}`} />
              </div>
              <span className={`text-[12px] font-black truncate ${card.color}`}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Connection Strip */}
        <div className="bg-[#F4F7FB] px-8 py-5 rounded-2xl border border-[#DDE4EF] flex justify-between items-center shadow-sm">
           <div className="flex flex-col gap-1">
              <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest">CUSTOMER ID</span>
              <span className="text-[12px] font-black text-[#1B2B4B]">{subscriber?.id || "N/A"}</span>
           </div>
           <div className="flex flex-col flex-1 px-12 gap-1 border-x border-[#DDE4EF] mx-12">
              <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest">SERVICE ADDRESS</span>
              <span className="text-[12px] font-black text-[#1B2B4B] truncate">{subscriber?.area || "Veraval, Gujarat"} | {subscriber?.customerNo}</span>
           </div>
           <div className="flex flex-col items-end gap-1">
              <span className="text-[7px] font-black text-[#94A3B8] uppercase tracking-widest">ACCOUNT STATUS</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full border border-emerald-200">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 text-[8px] font-black uppercase">ACTIVE</span>
              </div>
           </div>
        </div>

        <div className="flex gap-6">
          <InvoiceCustomerBlock 
            customerIdLabel={customerIdLabel} 
            subscriber={subscriber} 
            isCableMode={isCableMode} 
          />
          
          {/* Received Amount Card (Navy) */}
          <div className="flex-[0.4] bg-[#1B2B4B] p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
             <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-4">TOTAL AMOUNT PAID</p>
             <p className="text-white text-5xl font-black tracking-tighter mb-4">₹{Number(payment.amount).toLocaleString()}</p>
             <p className="text-[#F47920] text-[9px] font-black uppercase tracking-widest bg-white/10 px-6 py-2 rounded-full border border-white/10">PAYMENT CONFIRMED</p>
          </div>
        </div>

        {/* Allocation Details Table */}
        <div className="flex-1">
          <div className="bg-[#1B2B4B] rounded-t-3xl px-10 py-5 flex justify-between items-center">
             <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">PAYMENT ALLOCATION DETAILS</span>
             <span className="text-white text-[9px] font-black uppercase tracking-[0.2em]">AMOUNT (₹)</span>
          </div>
          <div className="border border-t-0 border-[#DDE4EF] rounded-b-3xl overflow-hidden shadow-sm">
             <div className="px-10 py-8 flex justify-between items-center bg-white">
                <div className="flex flex-col gap-2">
                   <span className="text-[14px] font-black text-[#1B2B4B] uppercase tracking-tight">
                     {isCableMode ? "Cable TV" : "Broadband"} Service Payment
                   </span>
                   <div className="flex items-center gap-2 text-[#64748B] text-[9px] font-bold uppercase tracking-widest">
                     <div className="h-1 w-1 rounded-full bg-emerald-500" />
                     <span>Transaction Reference: {payment.id.slice(-12).toUpperCase()}</span>
                   </div>
                </div>
                <span className="text-[18px] font-black text-[#1B2B4B]">₹{Number(payment.amount).toLocaleString()}.00</span>
             </div>
             <div className="px-10 py-4 bg-[#F8FAFC] border-t border-[#DDE4EF]/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Additional Arrears Cleared</span>
                <span className="text-[12px] font-bold text-[#64748B]">₹0.00</span>
             </div>
             <div className="px-10 py-4 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> ALL DUES CLEARED
                </span>
                <span className="text-[12px] font-black text-emerald-700">BALANCE: ₹0.00</span>
             </div>
          </div>
        </div>

        {/* Amount in Words Card */}
        <div className="p-8 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] shadow-sm">
          <p className="text-[#F47920] text-[8px] font-black uppercase tracking-widest mb-3">AMOUNT RECEIVED IN WORDS</p>
          <p className="text-[13px] font-black text-[#1B2B4B] italic uppercase leading-tight">
            {numberToWords(Number(payment.amount))} Rupees Only
          </p>
        </div>
        
        {/* Footer Area */}
        <div className="pt-10 flex flex-col items-center">
           <div className="flex items-center gap-6 w-full mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#DDE4EF] to-[#DDE4EF]" />
              <p className="text-[28px] font-black text-[#1B2B4B] tracking-tighter opacity-90">Payment Success!</p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#DDE4EF] to-[#DDE4EF]" />
           </div>
           <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.5em] mb-2">OFFICIAL DIGITAL RECEIPT • SITARAM CABLE</p>
           <div className="flex items-center gap-2 text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>Verified Transaction Confirmation</span>
           </div>
        </div>
      </div>

      <div className="bg-[#1B2B4B] py-4 text-center text-white/40 text-[8px] font-black uppercase tracking-[0.4em]">
        Computer Generated Electronic Receipt • No Physical Signature Required
      </div>
    </div>
  );

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

