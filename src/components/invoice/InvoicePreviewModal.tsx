import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mockData";
import { toast } from "sonner";
import { InvoiceHeader } from "./InvoiceHeader";
import { InvoiceMeta } from "./InvoiceMeta";
import { InvoiceCustomerBlock } from "./InvoiceCustomerBlock";
import { InvoiceTotals } from "./InvoiceTotals";
import { getBillingPeriodLabel, getInvoiceLabel, getInvoiceLineItem, getInvoiceServiceDates, getInvoiceStatusLabel } from "./invoicePreviewUtils";

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
      
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      
      setScale(newScale);
      
      // Update content height after a tiny delay to ensure render is complete
      setTimeout(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      }, 50);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Additional checks to ensure height is correct after images/QR load
    const timer1 = setTimeout(handleResize, 500);
    const timer2 = setTimeout(handleResize, 2000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const subscriber = useMemo(
    () => subscribers.find((item) => item.id === invoice.subscriberId),
    [invoice.subscriberId, subscribers],
  );
  const invoiceLabel = getInvoiceLabel(invoice, isCableMode);
  const invoiceStatusLabel = getInvoiceStatusLabel(invoice, isCableMode);
  const billingPeriodLabel = getBillingPeriodLabel(invoice);
  const lineItem = getInvoiceLineItem(invoice, subscriber, plans);
  const serviceDates = getInvoiceServiceDates(invoice, subscriber, plans);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) {
      toast.error("Invoice document not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    const fileName = `${invoice?.number || "INV"}.pdf`;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const options = {
        margin: 0,
        filename: fileName,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(options).from(element).save();
      toast.success("Invoice PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Could not generate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) {
      toast.error("Invoice document not ready. Please try again.");
      return;
    }

    if (!window.isSecureContext) {
      toast.error("Sharing is only available on secure (HTTPS) connections.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Generating official PDF...");
    const fileName = `${invoice?.number || "INV"}.pdf`;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const { saveAs } = await import("file-saver");
      const options = {
        margin: 0,
        filename: fileName,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      const pdfBlob = await html2pdf().set(options).from(element).toPdf().output("blob");
      if (!pdfBlob || pdfBlob.size < 1000) {
        throw new Error("PDF generation failed - file is empty.");
      }

      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*INVOICE: ${invoice.number}*
Hello ${subscriber?.name || "Customer"},
Please find attached your invoice for *${billingPeriodLabel}*.
Amount: Rs. ${invoice.amount}
Recharge Date: ${serviceDates.rechargeDate ? formatDate(serviceDates.rechargeDate) : "-"}
Expiry Date: ${serviceDates.expiryDate ? formatDate(serviceDates.expiryDate) : "-"}
Due Date: ${formatDate(invoice.dueDate)}`;

      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      const canShareFile = isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({
            files: [file],
            title: `Invoice ${invoice.number}`,
            text: message,
          });
          toast.dismiss(toastId);
          toast.success("Bill and message shared successfully!");
        } catch (shareError: any) {
          if (shareError.name === "AbortError") {
            toast.dismiss(toastId);
            toast.info("Sharing cancelled");
          } else {
            throw shareError;
          }
        }
      } else {
        saveAs(pdfBlob, fileName);

        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const isDesktop = !/Android|iPhone|iPad/i.test(navigator.userAgent);
        const waBase = isDesktop ? "https://web.whatsapp.com/send" : "https://wa.me";
        const whatsappUrl = `${waBase}/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
        const whatsappWindow = window.open(whatsappUrl, "_blank");

        if (!whatsappWindow) {
          toast.error("Popup blocked. Please allow popups for this site to open WhatsApp.");
        }

        toast.dismiss(toastId);
        toast.success("Bill downloaded. Please drag the PDF into the WhatsApp window.");
      }
    } catch (error) {
      console.error("Share flow error:", error);
      toast.dismiss(toastId);
      toast.error("Could not prepare the PDF for sharing.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white text-black w-full max-w-3xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-500 relative z-10 max-h-[95vh]">
        <div className="px-8 py-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Official Document Preview</span>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 flex justify-center p-4">
          <div 
            id="invoice-content" 
            ref={contentRef}
            className="bg-white relative font-sans text-slate-800 flex flex-col min-h-[1122px] w-[794px] shrink-0 sm:shadow-2xl origin-top transition-transform duration-300"
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * contentHeight}px`,
              marginLeft: `${((scale - 1) * 794) / 2}px`,
              marginRight: `${((scale - 1) * 794) / 2}px`
            }}
          >
            <InvoiceHeader brand={brand} invoiceLabel={invoiceLabel} />

            <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
              <InvoiceMeta
                billingPeriodLabel={billingPeriodLabel}
                expiryDate={serviceDates.expiryDate}
                invoice={invoice}
                invoiceStatusLabel={invoiceStatusLabel}
                rechargeDate={serviceDates.rechargeDate}
                subscriber={subscriber}
              />

              <div className="flex gap-4">
                <InvoiceCustomerBlock customerIdLabel={customerIdLabel} subscriber={subscriber} />
                <div className="w-48 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center text-center">
                  <p className="text-slate-400 text-[8px] font-black mb-1 uppercase tracking-widest">Payment Status</p>
                  <div className={`text-xs font-black py-1.5 rounded-full border uppercase tracking-widest ${
                    invoice.status === 'paid' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : invoice.status === 'overdue'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {invoice.status}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold italic">Due {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1e3a5f] text-white">
                    <th className="py-2.5 px-4 text-left font-black text-[10px] uppercase tracking-widest border-b-2 border-orange-500">Description of Service</th>
                    <th className="py-2.5 px-4 text-center font-black text-[10px] uppercase tracking-widest border-b-2 border-orange-500">Billing Period</th>
                    <th className="py-2.5 px-4 text-center font-black text-[10px] uppercase tracking-widest border-b-2 border-orange-500">Months</th>
                    <th className="py-2.5 px-4 text-right font-black text-[10px] uppercase tracking-widest border-b-2 border-orange-500">Plan Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 border-b border-slate-100">
                  <tr>
                    <td className="py-4 px-4">
                      <p className="font-black text-slate-900 text-sm">{lineItem.description}</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-1">
                        {invoice.type === "legacy"
                          ? lineItem.subDescription
                          : `${isCableMode ? "Cable TV" : "Broadband"} Service | ID: ${subscriber?.username || "N/A"}`}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-600 font-bold text-xs">
                      {formatDate(serviceDates.rechargeDate)} - {formatDate(serviceDates.expiryDate)}
                    </td>
                    <td className="py-4 px-4 text-center text-slate-900 font-black text-sm">{lineItem.quantity}</td>
                    <td className="py-4 px-4 text-right text-slate-900 font-black text-base">₹{lineItem.total}</td>
                  </tr>
                </tbody>
              </table>

              <InvoiceTotals brand={brand} invoice={invoice} invoices={invoices} payments={payments} />
              
              <div className="mt-auto pt-4 pb-4 text-center">
                <div className="inline-flex flex-col items-center">
                  <div className="h-px w-16 bg-slate-100 mb-3" />
                  <p className="text-base font-display font-black text-[#1e3a5f] tracking-tight">Thank You!</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">For choosing {brand.name}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e3a5f] border-t-2 border-orange-500 py-4 text-center text-white text-[10px] w-full">
              <p className="font-black tracking-widest uppercase opacity-80">This is a system generated invoice</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="flex-1 h-12 sm:h-16 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest text-slate-600 hover:bg-white border-slate-200 transition-all hover:shadow-md"
            onClick={onClose}
          >
            Cancel Preview
          </Button>
          <Button
            onClick={handleSharePDF}
            className="flex-1 h-12 sm:h-16 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-emerald-100 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            <Send className="h-5 w-5" />
            WhatsApp Bill
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isProcessing}
            className="flex-1 h-12 sm:h-16 bg-slate-900 text-white hover:bg-black rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Download PDF Record
          </Button>
        </div>
      </div>
    </div>
  );
}
