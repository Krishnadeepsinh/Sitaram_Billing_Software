import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mockData";
import { toast } from "sonner";
import { InvoiceHeader } from "../invoice/InvoiceHeader";
import { InvoiceCustomerBlock } from "../invoice/InvoiceCustomerBlock";
import { getInvoiceServiceDates } from "../invoice/invoicePreviewUtils";
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

  const paymentItems = useMemo(() => {
    if (!payment || !subscribers.length) return [];
    
    const sub = subscribers.find(s => s.id === payment.subscriberId);
    const plan = plans.find(p => p.id === sub?.planId);
    
    // Logic to determine what this payment covers
    const chronoInvoices = invoices
      .filter(inv => inv.subscriberId === payment.subscriberId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const subPayments = payments.filter(p => p.subscriberId === payment.subscriberId);
    const prevTotalPaid = subPayments
      .filter(p => new Date(p.date).getTime() < new Date(payment.date).getTime() || 
                  (new Date(p.date).getTime() === new Date(payment.date).getTime() && p.id < payment.id))
      .reduce((s, p) => s + Number(p.amount), 0);

    let historyLeft = prevTotalPaid;
    const openingBal = Number(sub?.openingBalance || 0);
    const alreadyCoveredOpening = Math.max(0, Math.min(openingBal, historyLeft));
    historyLeft -= alreadyCoveredOpening;
    const remainingOpeningDue = openingBal - alreadyCoveredOpening;

    const invoiceRemainingDues = new Map<string, { remaining: number, coveredByHistory: number }>();
    for (const inv of chronoInvoices) {
      const invAmount = Number(inv.amount || 0);
      const coveredByHistory = Math.max(0, Math.min(invAmount, historyLeft));
      historyLeft -= coveredByHistory;
      invoiceRemainingDues.set(inv.id, { remaining: invAmount - coveredByHistory, coveredByHistory });
    }

    const items: any[] = [];
    let remainingCurrentPayment = Number(payment.amount);

    if (remainingOpeningDue > 0 && remainingCurrentPayment > 0) {
      const amt = Math.min(remainingOpeningDue, remainingCurrentPayment);
      items.push({ 
        desc: "Previous Dues / Opening Balance", 
        period: "\u2014", 
        qty: "\u2014", 
        total: amt 
      });
      remainingCurrentPayment -= amt;
    }

    for (const inv of chronoInvoices) {
      const dues = invoiceRemainingDues.get(inv.id);
      if (!dues || dues.remaining <= 0 || remainingCurrentPayment <= 0) continue;
      const amt = Math.min(dues.remaining, remainingCurrentPayment);
      
      if (inv.type === 'legacy') {
        items.push({ 
          desc: "Previous Year Arrears", 
          period: inv.billingPeriod || formatDate(inv.date), 
          qty: "\u2014", 
          total: amt 
        });
      } else {
        const dates = getInvoiceServiceDates(inv, sub, plans);
        const planName = plan?.name || "Standard Plan";
        const cleanedPlanName = isCableMode 
          ? planName.replace(/\d+\s*(mbps|gbps|kbps)/gi, "").replace(/\[\d+\s*(mbps|gbps|kbps)\]/gi, "").replace(/\(\d+\s*(mbps|gbps|kbps)\)/gi, "").replace(/\s+/g, " ").trim() 
          : planName;
          
        items.push({ 
          desc: `${isCableMode ? "Cable TV" : "Broadband"} Service - ${cleanedPlanName}`, 
          period: `${formatDate(dates.rechargeDate)} - ${formatDate(dates.expiryDate)}`, 
          qty: "1", 
          total: amt 
        });
      }
      remainingCurrentPayment -= amt;
    }

    if (remainingCurrentPayment > 0.5) {
      items.push({ 
        desc: "Advance / Security Deposit", 
        period: "Future Billing", 
        qty: "\u2014", 
        total: remainingCurrentPayment 
      });
    }

    return items;
  }, [payment, subscribers, plans, invoices, payments, isCableMode]);

  const selectedPaymentServiceDates = useMemo(() => {
    const associatedInvoice = invoices.find(inv => inv.id === payment.invoiceId) || 
                             invoices.filter(inv => inv.subscriberId === payment.subscriberId)
                                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    return getInvoiceServiceDates(associatedInvoice, subscriber, plans);
  }, [payment, subscriber, invoices, plans]);

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const payload = {
        type: 'receipt',
        number: payment.id.slice(-8).toUpperCase(),
        date: formatDate(payment.date),
        method: payment.method,
        amount: payment.amount,
        customerNo: subscriber?.customerNo || '-',
        customerName: subscriber?.name || 'N/A',
        customerAddress: `${subscriber?.area || ''}\nBhavnagar, Gujarat`,
        stbNumber: subscriber?.customerId || subscriber?.customerUsername || 'N/A',
        customerMobile: subscriber?.phone || 'N/A',
        amountInWords: numberToWords(Number(payment.amount)),
        isCableMode: isCableMode,
        brand: {
          name: brand.name,
          address: brand.address,
          phone: brand.phone,
          upiId: brand.upiId
        },
        items: paymentItems.map(item => ({
          desc: item.desc,
          subDesc: item.subDesc || '',
          period: item.period,
          qty: item.qty,
          total: item.total
        }))
      };

      const response = await fetch('/api/generate_pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${payload.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Professional Receipt downloaded");
    } catch (error) {
      console.error("Receipt Generation Error:", error);
      toast.error("Failed to generate professional Receipt");
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
Method: ${payment.method}

Thank you for choosing ${brand.name}!`;

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
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Official Payment Receipt</span>
          </div>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 flex justify-center p-4">
          <div 
            id="receipt-content" 
            ref={contentRef}
            className="bg-white relative font-sans text-slate-800 flex flex-col min-h-[1122px] w-[794px] shrink-0 origin-top shadow-2xl"
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * contentHeight}px`,
              marginLeft: `${((scale - 1) * 794) / 2}px`,
              marginRight: `${((scale - 1) * 794) / 2}px`
            }}
          >
            <InvoiceHeader brand={brand} invoiceLabel="Payment Receipt" />

            <div className="p-8 space-y-6 flex-1 flex flex-col">
              {/* Receipt Metadata */}
              <div className="grid grid-cols-4 gap-[3mm] py-[4mm]">
                {/* RECEIPT NO */}
                <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
                  <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Receipt No.</p>
                  <p className="text-[9pt] font-bold text-[#1E293B]">#{payment.id.slice(-8).toUpperCase()}</p>
                </div>
                
                {/* PAYMENT DATE */}
                <div className="rounded-[4mm] border border-[#DDE4EF] bg-[#F4F7FB] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
                  <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Payment Date</p>
                  <p className="text-[9pt] font-bold text-[#1E293B]">{formatDate(payment.date)}</p>
                </div>
                
                {/* METHOD (Highlighted) */}
                <div className="rounded-[4mm] bg-[#1B2B4B] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
                  <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#94A3B8]">Method</p>
                  <p className="text-[9pt] font-bold text-white leading-tight">{payment.method}</p>
                </div>
                
                {/* STATUS */}
                <div className="rounded-[4mm] border border-[#BBF7D0] bg-[#DCFCE7] px-[3mm] py-[3mm] flex flex-col justify-between h-[17mm]">
                  <p className="text-[6.5pt] font-black uppercase tracking-widest text-[#16A34A]">Status</p>
                  <p className="text-[9pt] font-bold text-[#16A34A] uppercase tracking-tighter">SUCCESS</p>
                </div>
              </div>

              {/* Connection & Plan Details Bar */}
              <div className="flex items-center justify-between gap-4 px-6 py-3 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-8">
                  {subscriber?.customerNo && subscriber.customerNo !== "-" && (
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Customer No</span>
                      <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                        #{subscriber.customerNo}
                      </span>
                    </div>
                  )}
                  {(subscriber?.customerId || subscriber?.customerUsername) && (
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">{isCableMode ? "STB Number" : "Customer ID"}</span>
                      <span className="text-[11px] font-black text-[#1e3a5f] uppercase tracking-tight">
                        {subscriber.customerId || subscriber.customerUsername}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Plan Period</span>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                      {formatDate(selectedPaymentServiceDates.rechargeDate)} - {formatDate(selectedPaymentServiceDates.expiryDate)}
                    </span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex items-center gap-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Paid:</span>
                  <div className="text-xl font-black text-emerald-600 tracking-tighter">
                    ₹{Number(payment.amount).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex gap-[4mm] h-[45mm]">
                <InvoiceCustomerBlock customerIdLabel={customerIdLabel} subscriber={subscriber} isCableMode={isCableMode} />
                
                {/* Received Box (40%) */}
                <div className="flex-[0.4] bg-[#DCFCE7] p-[5mm] rounded-[4mm] border border-[#BBF7D0] flex flex-col justify-center text-center">
                  <p className="text-[#16A34A] text-[7pt] font-black mb-2 uppercase tracking-widest">TOTAL RECEIVED</p>
                  <div className="text-[18pt] font-black text-[#1B2B4B] tracking-tight leading-none">
                    Rs. {Number(payment.amount).toLocaleString()}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span className="text-[7.5pt] font-black uppercase tracking-widest text-[#16A34A]">Verified Payment</span>
                  </div>
                </div>
              </div>

              {/* Transaction Detail Table - Matches Invoice Style */}
              <div className="flex-1">
                <table className="w-full text-[8.5pt]">
                  <thead>
                    <tr className="bg-[#1B2B4B] text-white">
                      <th className="py-3 px-4 text-left font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[110mm]">Service Description</th>
                      <th className="py-3 px-4 text-center font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[30mm]">Service Period</th>
                      <th className="py-3 px-4 text-center font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[15mm]">Qty</th>
                      <th className="py-3 px-4 text-right font-bold uppercase tracking-wider border-b-[1.2mm] border-[#F47920] w-[35mm]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE4EF] border-b border-[#DDE4EF]">
                    {paymentItems.map((item, idx) => (
                      <tr key={idx} className="bg-[#FFFFFF]">
                        <td className="py-5 px-4">
                          <p className="font-bold text-[#1E293B] text-[10pt]">{item.desc}</p>
                          <p className="text-[8pt] text-[#64748B] mt-1">
                            {item.subDesc || `${isCableMode ? "Digital Cable TV" : "Broadband Internet"} Service`}
                          </p>
                        </td>
                        <td className="py-5 px-4 text-center text-[#64748B] font-bold">{item.period}</td>
                        <td className="py-5 px-4 text-center text-[#1E293B] font-bold text-[10pt]">{item.qty}</td>
                        <td className="py-5 px-4 text-right text-[#1E293B] font-bold text-[11pt]">Rs. {Number(item.total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between items-center text-slate-500 font-bold text-xs">
                    <span>Subtotal</span>
                    <span>₹{Number(payment.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-bold text-xs">
                    <span>Discount</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-[#1e3a5f] font-black text-sm uppercase tracking-wider">Net Received</span>
                    <span className="text-[#1e3a5f] font-black text-xl">₹{Number(payment.amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Professional Footer */}
              <div className="mt-auto pt-6 text-center">
                <div className="inline-flex flex-col items-center">
                  <div className="h-px w-16 bg-slate-100 mb-3" />
                  <p className="text-base font-display font-black text-[#1e3a5f] tracking-tight">Payment Confirmed</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Authorized Digital Receipt</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1B2B4B] border-t-[1.2mm] border-[#F47920] py-4 text-center text-white text-[7.5pt] w-full">
              <p className="font-bold tracking-widest uppercase opacity-90">This is a system generated receipt</p>
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
