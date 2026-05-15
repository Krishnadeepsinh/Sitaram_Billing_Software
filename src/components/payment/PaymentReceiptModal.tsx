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
    <div className="fixed inset-0 bg-slate-50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white text-black w-full max-w-3xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-500 relative z-10 max-h-[95vh]">
        <div className="px-8 py-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Official Payment Receipt</span>
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
            id="receipt-content" 
            ref={contentRef}
            className="bg-white relative font-sans text-slate-800 flex flex-col min-h-[1122px] w-[794px] shrink-0 sm:shadow-xl origin-top transition-transform duration-300"
            style={{ 
              transform: `scale(${scale})`, 
              marginBottom: `${(scale - 1) * contentHeight}px`,
              marginLeft: `${((scale - 1) * 794) / 2}px`,
              marginRight: `${((scale - 1) * 794) / 2}px`
            }}
          >
            <InvoiceHeader brand={brand} invoiceLabel="Payment Receipt" />

            <div className="p-10 space-y-10 flex-1 flex flex-col">
              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Receipt No.</span>
                  <span className="text-sm font-black text-slate-900 tracking-tight">#{payment.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Payment Date</span>
                  <span className="text-sm font-black text-slate-900 tracking-tight">{formatDate(payment.date)}</span>
                </div>
                <div className="p-5 rounded-3xl bg-[#0f172a] flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Method</span>
                  <span className="text-sm font-black text-white tracking-tight leading-tight">{payment.method}</span>
                </div>
                <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Status</span>
                  <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Success</span>
                </div>
              </div>

              <div className="flex gap-8 min-h-[180px]">
                <InvoiceCustomerBlock 
                  customerIdLabel={customerIdLabel} 
                  subscriber={subscriber} 
                  isCableMode={isCableMode} 
                />
                
                {/* Received Box (35%) */}
                <div className="flex-[0.35] bg-emerald-50/50 p-10 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-center text-center relative overflow-hidden group transition-all hover:shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-3xl" />
                  <p className="text-emerald-600 text-[9px] font-black mb-5 uppercase tracking-[0.4em] relative z-10">Total Received</p>
                  <div className="text-3xl font-black text-[#0f172a] tracking-tighter leading-none relative z-10">
                    ₹{Number(payment.amount).toLocaleString()}
                  </div>
                  <div className="mt-8 flex items-center justify-center gap-2 relative z-10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                  </div>
                </div>
              </div>

              {/* Transaction Detail Table */}
              <div className="flex-1 pt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 w-1/2">Payment Description</th>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 text-center">Service Period</th>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 text-center">Qty</th>
                      <th className="pb-6 pt-2 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-100 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {paymentItems.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-10 px-8">
                          <div className="flex flex-col gap-2">
                            <p className="font-black text-slate-900 text-lg tracking-tight leading-tight">{item.desc}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
                                {isCableMode ? "Digital TV" : "Broadband"} • {payment.method}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-10 px-8 text-center">
                          <span className="px-4 py-2 rounded-full bg-slate-50 text-slate-600 font-black text-[11px] tracking-tight border border-slate-100">
                            {item.period}
                          </span>
                        </td>
                        <td className="py-10 px-8 text-center text-slate-900 font-black text-base">{item.qty}</td>
                        <td className="py-10 px-8 text-right text-slate-900 font-black text-xl tracking-tighter">
                          ₹{Number(item.total).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="flex justify-between items-end pt-10">
                <div className="max-w-[400px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Amount in Words</p>
                  <p className="text-sm font-black text-slate-600 italic tracking-tight capitalize leading-relaxed">
                    {numberToWords(Number(payment.amount))} Only
                  </p>
                </div>
                <div className="w-72 space-y-4">
                  <div className="flex justify-between items-center px-4">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Net Received</span>
                    <span className="text-2xl font-black text-[#0f172a] tracking-tighter">₹{Number(payment.amount).toLocaleString()}</span>
                  </div>
                  <div className="p-6 rounded-[1.5rem] bg-[#0f172a] text-center">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em] mb-1">Receipt Status</p>
                    <p className="text-sm font-black text-white uppercase tracking-widest">Payment Confirmed</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-10 text-center">
                <div className="inline-flex flex-col items-center">
                  <div className="h-px w-24 bg-slate-100 mb-4" />
                  <p className="text-xl font-black text-[#0f172a] tracking-tighter">Thank You!</p>
                  <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em]">Authorized Digital Receipt</p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] py-6 text-center text-slate-500 text-[9px] w-full font-black uppercase tracking-[0.6em] mt-auto">
              Computer Generated Receipt • Official Confirmation of Payment
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-16 rounded-[1.5rem] font-black text-slate-500 uppercase tracking-widest text-[11px] bg-white border-slate-200 hover:bg-slate-100 transition-all"
          >
            Close Receipt
          </Button>
          <Button
            variant="outline"
            onClick={handleSharePDF}
            disabled={isProcessing}
            className="flex-1 h-16 rounded-[1.5rem] font-black text-emerald-600 uppercase tracking-widest text-[11px] bg-emerald-50 border-emerald-100 hover:bg-emerald-100 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            WhatsApp Receipt
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
