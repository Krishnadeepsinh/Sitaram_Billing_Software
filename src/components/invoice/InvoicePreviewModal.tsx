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
    <div className="fixed inset-0 bg-slate-50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={onClose} />
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
            className="bg-white relative font-sans text-slate-800 flex flex-col min-h-[1122px] w-[794px] shrink-0 sm:shadow-xl origin-top transition-transform duration-300"
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * contentHeight}px`,
              marginLeft: `${((scale - 1) * 794) / 2}px`,
              marginRight: `${((scale - 1) * 794) / 2}px`
            }}
          >
            <InvoiceHeader brand={brand} invoiceLabel={invoiceLabel} />

            <div className="p-10 space-y-10 flex-1 flex flex-col">
              <InvoiceMeta
                billingPeriodLabel={billingPeriodLabel}
                invoice={invoice}
              />

              <div className="flex gap-8 min-h-[180px]">
                <InvoiceCustomerBlock 
                  customerIdLabel={customerIdLabel} 
                  subscriber={subscriber} 
                  isCableMode={isCableMode} 
                />
                
                {/* Status Box (35%) */}
                <div className="flex-[0.35] bg-orange-50/50 p-10 rounded-[2.5rem] border border-orange-100 flex flex-col justify-center text-center relative overflow-hidden group transition-all hover:shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-3xl transition-colors group-hover:bg-orange-500/10" />
                  <p className="text-orange-500 text-[9px] font-black mb-5 uppercase tracking-[0.4em] relative z-10">Invoice Status</p>
                  <div className={`text-sm font-black py-4 rounded-2xl border uppercase tracking-[0.2em] relative z-10 shadow-sm ${
                    invoice.status === 'paid' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : invoice.status === 'overdue'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-white text-orange-600 border-orange-100'
                  }`}>
                    {invoice.status}
                  </div>
                  <div className="mt-8 space-y-1 relative z-10">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Valid Until</p>
                    <p className="text-base text-slate-700 font-black tracking-tight">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="flex-1 pt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 w-1/2">Service Summary</th>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 text-center">Billing Span</th>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 text-center">Qty</th>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    <tr className="group">
                      <td className="py-12 px-8">
                        <div className="flex flex-col gap-2">
                          <p className="font-black text-slate-900 text-lg tracking-tight leading-tight">{lineItem.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                              {isCableMode ? "Digital TV Subscription" : "Premium Fiber Internet"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-12 px-8 text-center">
                        <span className="px-4 py-2 rounded-full bg-slate-50 text-slate-600 font-black text-[11px] tracking-tight border border-slate-100">
                          {billingPeriodLabel}
                        </span>
                      </td>
                      <td className="py-12 px-8 text-center text-slate-900 font-black text-base">01</td>
                      <td className="py-12 px-8 text-right text-slate-900 font-black text-xl tracking-tighter">
                        ₹{Number(lineItem.price).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <InvoiceTotals brand={brand} invoice={invoice} invoices={invoices} payments={payments} />
            </div>

            <div className="bg-[#0f172a] py-6 text-center text-slate-500 text-[9px] w-full font-black uppercase tracking-[0.6em] mt-auto">
              Computer Generated Document • No Physical Signature Required
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-16 rounded-[1.5rem] font-black text-slate-500 uppercase tracking-widest text-[11px] bg-white border-slate-200 hover:bg-slate-100 transition-all"
          >
            Cancel Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleSharePDF}
            disabled={isProcessing}
            className="flex-1 h-16 rounded-[1.5rem] font-black text-orange-600 uppercase tracking-widest text-[11px] bg-orange-50 border-orange-100 hover:bg-orange-100 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            WhatsApp Bill
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isProcessing}
            className="flex-1 h-16 rounded-[1.5rem] font-black text-white uppercase tracking-widest text-[11px] bg-[#0f172a] hover:bg-slate-900 shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
