import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mockData";
import { toast } from "sonner";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { Logo } from "@/components/Logo";

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
};

export default function PaymentReceiptModal({
  brand,
  customerIdLabel,
  payment,
  subscribers,
  onClose,
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
      
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      
      setScale(newScale);
      
      setTimeout(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      }, 50);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const timer1 = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer1);
    };
  }, []);

  const subscriber = useMemo(
    () => subscribers.find((item) => item.id === payment.subscriberId),
    [payment.subscriberId, subscribers],
  );

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsProcessing(true);
    try {
      const element = contentRef.current;
      const html2pdf = (await import("html2pdf.js")).default;
      
      const options = {
        margin: 0,
        filename: `Receipt_${payment.id.slice(-8).toUpperCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          windowWidth: 794,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(options).from(element).save();
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      toast.error("Failed to generate PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    if (!contentRef.current) return;
    setIsProcessing(true);
    const toastId = toast.loading("Preparing receipt...");
    const fileName = `Receipt_${payment.id.slice(-8).toUpperCase()}.pdf`;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const pdfBlob = await html2pdf().set({
        margin: 0,
        filename: fileName,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 794 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(contentRef.current).toPdf().output("blob");

      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*PAYMENT RECEIPT*
Hello ${subscriber?.name || "Customer"},
Thank you for your payment of *Rs. ${payment.amount}*.
Transaction ID: ${payment.id.slice(-8).toUpperCase()}
Date: ${formatDate(payment.date)}
Method: ${payment.method}`;

      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobile && navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Payment Receipt", text: message });
      } else {
        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const waBase = /Android|iPhone|iPad/i.test(navigator.userAgent) ? "https://wa.me" : "https://web.whatsapp.com/send";
        window.open(`${waBase}/${phoneWithCountry}?text=${encodeURIComponent(message)}`, "_blank");
        toast.info("Message opened in WhatsApp. Please attach the downloaded receipt.");
      }
      toast.dismiss(toastId);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Could not share receipt.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white text-black w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-500 relative z-10 max-h-[95vh]">
        <div className="px-8 py-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Payment Acknowledgement</span>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 flex justify-center p-4">
          <div 
            id="receipt-content" 
            ref={contentRef}
            className="bg-white relative font-sans text-slate-800 flex flex-col min-h-[1122px] w-[794px] shrink-0 origin-top"
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * contentHeight}px`
            }}
          >
            {/* Professional Header - Exact match to Invoice */}
            <InvoiceHeader brand={brand} invoiceLabel="Payment Receipt" />

            <div className="p-10 space-y-8 flex-1 flex flex-col">
              {/* Receipt Metadata */}
              <div className="grid grid-cols-4 gap-4 border-b border-slate-100 pb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Receipt No</p>
                  <p className="text-sm font-black text-[#1e3a5f]">#{payment.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Payment Date</p>
                  <p className="text-sm font-black text-[#1e3a5f]">{formatDate(payment.date)}</p>
                </div>
                <div className="bg-[#1e3a5f] p-4 rounded-2xl border border-[#1e3a5f] text-center shadow-lg">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">Method</p>
                  <p className="text-sm font-black text-white">{payment.method}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Status</p>
                  <p className="text-sm font-black text-emerald-700 uppercase tracking-tighter">SUCCESS</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex gap-6 items-start">
                <div className="flex-1 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#1e3a5f]">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment From</p>
                      <h3 className="text-xl font-black text-slate-900">{subscriber?.name}</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{customerIdLabel}</p>
                      <p className="text-sm font-black text-[#1e3a5f]">{subscriber?.customerNo}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Area / Zone</p>
                      <p className="text-sm font-black text-[#1e3a5f]">{subscriber?.area || 'General'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-64 bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col justify-between">
                   <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Amount Paid</p>
                    <p className="text-4xl font-black tracking-tight text-white">₹{Number(payment.amount).toLocaleString()}</p>
                   </div>
                   <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold text-blue-200/50 uppercase italic">Paid in Full</p>
                   </div>
                </div>
              </div>

              {/* Transaction Detail Table */}
              <div className="flex-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#1e3a5f] text-white">
                      <th className="py-3 px-6 text-left font-black text-[10px] uppercase tracking-widest border-b-2 border-orange-500 rounded-tl-xl">Transaction Description</th>
                      <th className="py-3 px-6 text-right font-black text-[10px] uppercase tracking-widest border-b-2 border-orange-500 rounded-tr-xl">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-xl overflow-hidden">
                    <tr>
                      <td className="py-8 px-6">
                        <p className="font-black text-slate-900 text-lg">Internet Service Subscription</p>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
                          Payment for account {subscriber?.username || subscriber?.customerNo}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 italic font-medium leading-relaxed max-w-md">
                          This receipt confirms the successful transfer of funds towards your service account balance. 
                          The amount has been credited to your ledger effective {formatDate(payment.date)}.
                        </p>
                      </td>
                      <td className="py-8 px-6 text-right align-top">
                        <p className="text-2xl font-black text-slate-900">₹{Number(payment.amount).toLocaleString()}</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Professional Footer */}
              <div className="pt-10 flex justify-between items-end border-t-2 border-slate-100 border-dashed">
                <div className="space-y-4">
                  <Logo size="md" showText={true} />
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    <p>Digital Transaction Receipt</p>
                    <p>Generated on {new Date().toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block text-center space-y-2">
                    <div className="h-16 w-48 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center italic text-slate-300 text-[10px]">
                      Digital Signature Verified
                    </div>
                    <p className="text-[10px] font-black text-[#1e3a5f] uppercase tracking-widest">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1e3a5f] border-t-2 border-orange-500 py-4 text-center text-white text-[10px] w-full">
              <p className="font-black tracking-widest uppercase opacity-80">Thank you for your business!</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest text-slate-600 hover:bg-white border-slate-200"
            onClick={onClose}
          >
            Close Receipt
          </Button>
          <Button
            onClick={handleSharePDF}
            className="flex-1 h-12 sm:h-14 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3"
          >
            <Send className="h-5 w-5" />
            WhatsApp Receipt
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isProcessing}
            className="flex-1 h-12 sm:h-14 bg-slate-900 text-white hover:bg-black rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
