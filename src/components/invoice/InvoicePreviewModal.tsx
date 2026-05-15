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
import { numberToWords } from "@/lib/utils";

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
  const lineItem = getInvoiceLineItem(invoice, subscriber, plans, isCableMode);
  const serviceDates = getInvoiceServiceDates(invoice, subscriber, plans);

  const generatePreviewPdfBlob = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) {
      throw new Error("Invoice document not ready.");
    }

    const html2pdf = (await import("html2pdf.js")).default;
    const options = {
      margin: 0,
      filename: `${invoice?.number || "INV"}.pdf`,
      image: { type: "jpeg" as const, quality: 1.0 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 794,
        onclone: (doc: Document) => {
          const el = doc.getElementById("invoice-content");
          if (el) {
            el.style.transform = "none";
            el.style.margin = "0";
            el.style.padding = "40px";
            el.style.width = "794px";
            el.style.backgroundColor = "white";
            el.style.color = "black";
            const allText = el.querySelectorAll("*");
            allText.forEach((node: any) => {
              if (node.style) {
                node.style.color = "black";
                node.style.borderColor = "#eee";
              }
            });
          }
        }
      },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    };

    const pdfBlob = await html2pdf().set(options).from(element).toPdf().output("blob");
    if (!pdfBlob || pdfBlob.size < 1000) {
      throw new Error("PDF generation failed - file is empty.");
    }

    return pdfBlob as Blob;
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const { saveAs } = await import("file-saver");
      const blob = await generatePreviewPdfBlob();
      saveAs(blob, `Invoice_${invoice.invoiceNumber || invoice.number || "INV"}.pdf`);
      
      toast.success("Professional Invoice downloaded");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate professional PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    if (!window.isSecureContext) {
      toast.error("Sharing is only available on secure (HTTPS) connections.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Generating official PDF...");
    const fileName = `${invoice?.number || "INV"}.pdf`;

    try {
      const { saveAs } = await import("file-saver");
      const pdfBlob = await generatePreviewPdfBlob();
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

              <div className="flex gap-[4mm] min-h-[45mm]">
                <InvoiceCustomerBlock customerIdLabel={customerIdLabel} subscriber={subscriber} isCableMode={isCableMode} />
                
                {/* Status Box (40%) */}
                <div className="flex-[0.4] bg-[#FFF7ED] p-[5mm] rounded-[4mm] border border-[#FED7AA] flex flex-col justify-center text-center">
                  <p className="text-[#F47920] text-[7pt] font-black mb-2 uppercase tracking-widest">PAYMENT STATUS</p>
                  <div className={`text-[12pt] font-bold py-2 rounded-[3mm] border uppercase tracking-widest ${
                    invoice.status === 'paid' 
                      ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]' 
                      : invoice.status === 'overdue'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {invoice.status}
                  </div>
                  <p className="text-[8pt] text-[#64748B] mt-3 font-bold">DUE: {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <table className="w-full text-[8.5pt]">
                <thead>
                  <tr className="bg-[#1B2B4B] text-white">
                    <th className="py-3 px-4 text-left font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[110mm]">Description of Service</th>
                    <th className="py-3 px-4 text-center font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[30mm]">Billing Period</th>
                    <th className="py-3 px-4 text-center font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[15mm]">Qty</th>
                    <th className="py-3 px-4 text-right font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[35mm]">Plan Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE4EF] border-b border-[#DDE4EF]">
                  <tr className="bg-[#FFFFFF]">
                    <td className="py-5 px-4">
                      <p className="font-bold text-[#1E293B] text-[10pt]">{lineItem.description}</p>
                      <p className="text-[8pt] text-[#64748B] mt-1">
                        {isCableMode ? "Digital Cable TV" : "Broadband"} Service {(subscriber?.customerId || subscriber?.customerUsername) ? `| ID: ${subscriber?.customerId || subscriber?.customerUsername}` : ""}
                      </p>
                    </td>
                    <td className="py-5 px-4 text-center text-[#64748B] font-bold">
                      {formatDate(serviceDates.rechargeDate)} - {formatDate(serviceDates.expiryDate)}
                    </td>
                    <td className="py-5 px-4 text-center text-[#1E293B] font-bold text-[10pt]">{lineItem.quantity}</td>
                    <td className="py-5 px-4 text-right text-[#1E293B] font-bold text-[11pt]">Rs. {lineItem.total}</td>
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

            <div className="bg-[#1B2B4B] border-t-[1.2mm] border-[#F47920] py-4 text-center text-white text-[7.5pt] w-full">
              <p className="font-bold tracking-widest uppercase opacity-90">This is a system generated invoice</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest text-slate-600 hover:bg-white border-slate-200 transition-all hover:shadow-md"
            onClick={onClose}
          >
            Cancel Preview
          </Button>
          <Button
            onClick={handleSharePDF}
            className="flex-1 h-12 sm:h-14 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-emerald-100 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            <Send className="h-5 w-5" />
            WhatsApp Bill
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isProcessing}
            className="flex-1 h-12 sm:h-14 bg-slate-900 text-white hover:bg-black rounded-xl sm:rounded-[1.25rem] font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 flex items-center justify-center gap-3"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            Download PDF Record
          </Button>
        </div>
      </div>
    </div>
  );
}
