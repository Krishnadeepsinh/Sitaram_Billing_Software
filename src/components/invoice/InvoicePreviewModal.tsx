import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X, ShieldCheck, CreditCard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatFullDate } from "@/lib/mockData";
import { toast } from "sonner";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceMeta } from "./InvoiceMeta";
import { InvoiceCustomerBlock } from "./InvoiceCustomerBlock";
import { InvoiceTotals } from "./InvoiceTotals";
import { getBillingPeriodLabel, getInvoiceLabel, getInvoiceLineItem } from "./invoicePreviewUtils";

type InvoicePreviewModalProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
    upiId: string;
    gstin?: string;
  };
  customerIdLabel: string;
  invoice: any;
  invoices: any[];
  isCableMode: boolean;
  onClose: () => void;
  payments: any[];
  plans: any[];
  subscribers: any[];
};

export default function InvoicePreviewModal({
  brand,
  customerIdLabel,
  invoice,
  invoices,
  isCableMode,
  onClose,
  payments,
  plans,
  subscribers,
}: InvoicePreviewModalProps) {
  if (!invoice) return null;
  
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
    () => subscribers.find((item) => item.id === invoice.subscriberId),
    [invoice.subscriberId, subscribers],
  );
  const invoiceLabel = getInvoiceLabel(invoice, isCableMode);
  const billingPeriodLabel = getBillingPeriodLabel(invoice);
  const lineItem = getInvoiceLineItem(invoice, subscriber, plans, isCableMode);

  const generatePdfBlob = async () => {
    const element = document.getElementById("invoice-content-print");
    if (!element) throw new Error("Document not ready");

    element.style.display = "block";
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";

    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // Small delay to ensure DOM is painted after display: block
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2, 
        backgroundColor: "#ffffff",
        cacheBust: true,
        includeQueryParams: true,
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
      
      element.style.display = "none";
      return pdf.output("blob");
    } catch (err) {
      console.error("PDF Gen Error:", err);
      element.style.display = "none";
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const blob = await generatePdfBlob();
      const { saveAs } = await import("file-saver");
      saveAs(blob, `Invoice_${invoice.number}.pdf`);
      toast.success("Invoice downloaded successfully");
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
      const fileName = `Invoice_${invoice.number}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*INVOICE: ${invoice.number}*\nHello ${subscriber?.name || "Customer"},\nPlease find attached your invoice for *${billingPeriodLabel}*.\nAmount: Rs. ${invoice.amount}\nDue Date: ${formatFullDate(invoice.dueDate)}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${invoice.number}`, text: message });
      } else {
        const { saveAs } = await import("file-saver");
        saveAs(pdfBlob, fileName);
        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success("Bill downloaded & WhatsApp opened");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not share PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const InvoiceContent = ({ id }: { id?: string }) => (
    <div 
      id={id}
      className="bg-white relative font-sans flex flex-col min-h-[1122px] w-[794px] shrink-0"
    >
      <InvoiceHeader brand={brand} invoiceLabel={invoiceLabel} />

      <div className="p-12 space-y-8 flex-1 flex flex-col">
        <InvoiceMeta billingPeriodLabel={billingPeriodLabel} invoice={invoice} />

        {/* Info Strips Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F4F7FB] px-6 py-4 rounded-2xl border border-[#DDE4EF] flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-[#DDE4EF]">
              <ShieldCheck className="h-5 w-5 text-[#1B2B4B]" />
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">CUSTOMER IDENTITY</p>
              <p className="text-[11px] font-black text-[#1B2B4B]">{subscriber?.id || "N/A"}</p>
            </div>
          </div>
          <div className="bg-[#FEF2F2] px-6 py-4 rounded-2xl border border-[#FCA5A5] flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-[#FCA5A5]">
              <Calendar className="h-5 w-5 text-[#EF4444]" />
            </div>
            <div>
              <p className="text-[7px] font-black text-[#EF4444] uppercase tracking-widest">PAYMENT STATUS</p>
              <p className="text-[11px] font-black text-[#B91C1C]">UNPAID - PLEASE REMIT</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <InvoiceCustomerBlock 
            customerIdLabel={customerIdLabel} 
            subscriber={subscriber} 
            isCableMode={isCableMode} 
          />
          
          <div className="flex-[0.4] bg-[#1B2B4B] p-8 rounded-[2rem] flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
             <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em] mb-4">TOTAL AMOUNT DUE</p>
             <p className="text-white text-5xl font-black tracking-tighter mb-4">₹{(Number(String(invoice.amount).replace(/[^0-9.]/g, '')) || 0).toLocaleString()}</p>
             <p className="text-[#F47920] text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-1.5 rounded-full text-center">Due by {formatFullDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Modern Table Section */}
        <div className="flex-1">
          <div className="bg-[#1B2B4B] rounded-t-3xl px-10 py-5 grid grid-cols-12 gap-4">
             <span className="col-span-4 text-white text-[9px] font-black uppercase tracking-[0.2em]">DESCRIPTION</span>
             <span className="col-span-3 text-center text-white text-[9px] font-black uppercase tracking-[0.2em]">PERIOD</span>
             <span className="col-span-2 text-right text-white text-[9px] font-black uppercase tracking-[0.2em]">PLAN</span>
             <span className="col-span-3 text-right text-white text-[9px] font-black uppercase tracking-[0.2em]">TOTAL</span>
          </div>
          <div className="border-x border-b border-[#DDE4EF] rounded-b-3xl overflow-hidden bg-white shadow-sm">
             <div className="px-10 py-10 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-4 flex flex-col gap-2">
                   <span className="text-[14px] font-black text-[#1B2B4B] uppercase tracking-tight">{lineItem.description}</span>
                   <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#F47920]" />
                      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">
                        {isCableMode ? "High Definition Digital Television" : "High Speed Fiber Optic Internet"}
                      </span>
                   </div>
                </div>
                <div className="col-span-3 text-center">
                   <span className="text-[11px] font-black text-[#1B2B4B] py-1.5 px-4 bg-[#F4F7FB] rounded-full border border-[#DDE4EF]">
                     {billingPeriodLabel}
                   </span>
                </div>
                <div className="col-span-2 text-right">
                   <span className="text-[14px] font-black text-[#1B2B4B]">₹{(Number(String(lineItem.rate).replace(/[^0-9.]/g, '')) || 0).toLocaleString()}</span>
                </div>
                <div className="col-span-3 text-right">
                   <span className="text-[16px] font-black text-[#1B2B4B]">₹{(Number(String(lineItem.total).replace(/[^0-9.]/g, '')) || 0).toLocaleString()}.00</span>
                </div>
             </div>
             
             {/* Previous Dues Row (if any) */}
             <div className="px-10 py-4 bg-[#F8FAFC] border-t border-[#DDE4EF]/50 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-9 flex items-center gap-3">
                   <div className="h-1 w-1 rounded-full bg-[#64748B]" />
                   <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Additional Charges / Previous Balance</span>
                </div>
                <div className="col-span-3 text-right">
                   <span className="text-[11px] font-bold text-[#64748B]">₹0.00</span>
                </div>
             </div>
          </div>
        </div>

        <InvoiceTotals brand={brand} invoice={invoice} invoices={invoices} />
        
        {/* Footer Area */}
        <div className="pt-10 flex flex-col items-center">
           <div className="flex items-center gap-6 w-full mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#DDE4EF] to-[#DDE4EF]" />
              <p className="text-[32px] font-black text-[#1B2B4B] tracking-tighter opacity-90">Thank You!</p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#DDE4EF] to-[#DDE4EF]" />
           </div>
           <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.5em] mb-2">SITARAM CABLE & BROADBAND • VERAVAL</p>
           <div className="flex items-center gap-2 text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified Merchant • Secure Payment System</span>
           </div>
        </div>
      </div>

      <div className="bg-[#1B2B4B] py-4 text-center text-white/40 text-[8px] font-black uppercase tracking-[0.4em]">
        Computer Generated Electronic Document • Valid without Signature
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
            <div className="h-3 w-3 rounded-full bg-[#F47920] shadow-[0_0_10px_#F47920] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1B2B4B]">High-Fidelity Preview</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Document Ready for Export</span>
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
            <InvoiceContent id="invoice-content" />
          </div>
        </div>

        {/* Hidden Container for PDF Generation (to ensure Scale 1:1) */}
        <div style={{ display: "none" }}>
          <InvoiceContent id="invoice-content-print" />
        </div>

        {/* Action Bar */}
        <div className="p-10 bg-white border-t border-slate-100 flex gap-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="h-16 px-10 rounded-2xl font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 hover:text-slate-900 border-slate-200"
          >
            Discard
          </Button>
          <div className="flex-1 flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleSharePDF} 
              disabled={isProcessing}
              className="flex-1 h-16 rounded-2xl font-black text-[#F47920] uppercase tracking-[0.2em] text-[10px] bg-orange-50/50 border-orange-100 hover:bg-orange-50 transition-all flex gap-3 items-center justify-center"
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
              Download Professional PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
