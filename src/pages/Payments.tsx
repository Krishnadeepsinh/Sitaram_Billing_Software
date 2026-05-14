import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Search, Receipt, Wallet, CreditCard, Banknote, Filter, Loader2, Trash2, Download, Eye, X, MapPin, Phone, Wifi, Check, Send, Activity, CheckCircle2, Share2, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBilling } from "@/context/BillingContext";
import { Logo } from "@/components/Logo";
import { getInvoiceServiceDates } from "@/components/invoice/invoicePreviewUtils";
import { toast } from "sonner";
import { BRAND_DISPLAY_NAME, getBrandSettings } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useBusinessMode } from "@/lib/turso";

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query || !text) return <>{text || ""}</>;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <>{text}</>;
  
  const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const matchRegex = new RegExp(`^(${escapedTokens.join('|')})$`, 'i');
  const parts = String(text).split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        matchRegex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 px-0.5 rounded-sm font-bold">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function Payments() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const customerIdLabel = isCableMode ? "STB Number" : "Customer ID";
  const { payments, subscribers, plans, invoices, recordPayment, deletePayment, isLoading, companySettings, refreshData } = useBilling();
  const brand = getBrandSettings(companySettings);
  const [q, setQ] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{type: 'delete', id: string} | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [dateF, setDateF] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
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

    if (isReceiptOpen) {
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
    }
  }, [isReceiptOpen]);
  const loadHtml2Pdf = async () => (await import("html2pdf.js")).default;

  const getPaymentItems = (payment: any) => {
    if (!payment) return [];
    
    const sub = subscribers.find(s => s.id === payment.subscriberId);
    const plan = plans.find(p => p.id === sub?.planId);
    const planPrice = plan?.price || 200;
    
    const subInvoices = invoices.filter(inv => inv.subscriberId === payment.subscriberId)
      .sort((a, b) => {
        // 1. Prioritize the explicitly linked invoice first
        if (payment.invoiceId === a.id) return -1;
        if (payment.invoiceId === b.id) return 1;
        
        // 2. Then Legacy invoices
        const typeA = a.type === 'legacy' ? 0 : 1;
        const typeB = b.type === 'legacy' ? 0 : 1;
        if (typeA !== typeB) return typeA - typeB;
        
        // 3. Then by date
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    
    const subPayments = payments.filter(p => p.subscriberId === payment.subscriberId);
    const prevTotalPaid = subPayments
      .filter(p => new Date(p.date).getTime() < new Date(payment.date).getTime() || 
                  (new Date(p.date).getTime() === new Date(payment.date).getTime() && p.id < payment.id))
      .reduce((s, p) => s + Number(p.amount) + (Number(p.discount) || 0), 0);

    const currentPaymentTotal = Number(payment.amount) + (Number(payment.discount) || 0);
    const openingBal = Number(sub?.openingBalance || 0);
    
    // 1. First, calculate what was already covered by previous payments chronologically
    const chronoInvoices = invoices.filter(inv => inv.subscriberId === payment.subscriberId)
      .sort((a, b) => {
        const typeA = a.type === 'legacy' ? 0 : 1;
        const typeB = b.type === 'legacy' ? 0 : 1;
        if (typeA !== typeB) return typeA - typeB;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    let historyLeft = prevTotalPaid;
    const alreadyCoveredOpening = Math.max(0, Math.min(openingBal, historyLeft));
    historyLeft -= alreadyCoveredOpening;
    const remainingOpeningDue = openingBal - alreadyCoveredOpening;

    const invoiceRemainingDues = new Map<string, { remaining: number, coveredByHistory: number }>();
    for (const inv of chronoInvoices) {
      const invAmount = Number(inv.amount || 0);
      const coveredByHistory = Math.max(0, Math.min(invAmount, historyLeft));
      historyLeft -= coveredByHistory;
      invoiceRemainingDues.set(inv.id, { 
        remaining: invAmount - coveredByHistory,
        coveredByHistory
      });
    }

    // 2. Now process the current payment using priority sorting
    const priorityInvoices = [...chronoInvoices].sort((a, b) => {
      if (payment.invoiceId === a.id) return -1;
      if (payment.invoiceId === b.id) return 1;
      return 0; // Keep chrono order for the rest
    });

    const items: any[] = [];
    let remainingCurrentPayment = currentPaymentTotal;

    // Handle Opening Balance
    if (remainingOpeningDue > 0 && remainingCurrentPayment > 0) {
      const amountToCoverOpening = Math.min(remainingOpeningDue, remainingCurrentPayment);
      items.push({
        desc: "Previous Dues / Opening Balance",
        subDesc: "Outstanding balance from previous period",
        date: "—",
        qty: "—",
        total: amountToCoverOpening,
        dueAmount: remainingOpeningDue
      });
      remainingCurrentPayment -= amountToCoverOpening;
    }

    // Handle Invoices in priority order
    for (const inv of priorityInvoices) {
      const dues = invoiceRemainingDues.get(inv.id);
      if (!dues || dues.remaining <= 0 || remainingCurrentPayment <= 0) continue;

      const amountToCoverNow = Math.min(dues.remaining, remainingCurrentPayment);
      const wasAlreadyCovered = dues.coveredByHistory;
      const remainingInvAmount = dues.remaining;
      
      if (inv.type === 'legacy') {
        items.push({
          desc: "Previous Year Billing",
          subDesc: "Historical dues formalized in invoice",
          date: formatDate(inv.date),
          qty: "—",
          total: amountToCoverNow,
          dueAmount: remainingInvAmount
        });
      } else {
          const invAmount = Number(inv.amount || 0);
          const originalInvAmount = invAmount + (inv.id === payment.invoiceId ? 0 : (inv.discount || 0));
          const totalInvMonths = Math.max(1, Math.round(originalInvAmount / planPrice));
          
          const monthsAlreadyPaid = Math.floor(wasAlreadyCovered / planPrice);
          const monthsCoveredNow = Math.max(1, Math.round(amountToCoverNow / planPrice));
          
          const isPartial = amountToCoverNow < (remainingInvAmount - 0.5);
          
          // Fix: Add 12 hours to baseDate to avoid timezone shifts
          const baseDate = new Date(new Date(inv.date).getTime() + 12 * 60 * 60 * 1000);
          const monthsToDisplay: Date[] = [];
          for (let i = 0; i < monthsCoveredNow; i++) {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + monthsAlreadyPaid + i); 
            monthsToDisplay.push(d);
          }

          // Fallback: If only 1 month, just use the invoice date's month to be safe. 
          // Ensure we use the date from the invoice record, normalized to midday.
          const invDate = new Date(inv.date);
          invDate.setHours(12, 0, 0, 0);
          const displayPeriod = inv.billingPeriod || (monthsCoveredNow === 1 
            ? invDate.toLocaleString('default', { month: 'short', year: '2-digit' }).toUpperCase()
            : formatMonthRanges(monthsToDisplay));

          items.push({
            desc: `${(Number(plan?.validityDays || 30) > 31 || String(displayPeriod).includes(" TO ")) ? "Plan Recharge" : "Monthly Subscription"} (${displayPeriod})`,
            subDesc: `${plan?.name || 'Broadband'} Plan Rate${isPartial ? ` (₹${remainingInvAmount - amountToCoverNow} still pending for this month)` : (totalInvMonths > (monthsAlreadyPaid + monthsCoveredNow) ? ` (${totalInvMonths - monthsAlreadyPaid - monthsCoveredNow} more month(s) pending)` : '')}`,
            date: formatDate(inv.date),
            qty: isPartial ? "Partial" : monthsCoveredNow,
            total: amountToCoverNow,
            dueAmount: remainingInvAmount
          });
        }
        remainingCurrentPayment -= amountToCoverNow;
      }

    const paymentDiscount = Number(payment.discount || 0);
    const remainingDiscountPart = Math.min(remainingCurrentPayment, paymentDiscount);
    const remainingAdvancePart = Math.max(0, remainingCurrentPayment - remainingDiscountPart);

    if (remainingDiscountPart >= 0.1) {
      items.push({ desc: "Discount Given", subDesc: "Promotional or adjustment discount", date: formatDate(payment.date), qty: "—", total: remainingDiscountPart });
    }
    if (remainingAdvancePart >= 0.1) {
      items.push({ desc: "Credit or Advance Received", subDesc: "Added to account balance for future billing", date: formatDate(payment.date), qty: "—", total: remainingAdvancePart });
    }

    if (items.length === 0 && currentPaymentTotal > 0) {
      if (remainingDiscountPart >= 0.1) {
        items.push({ desc: "Discount Given", subDesc: "Adjustment discount", date: formatDate(payment.date), qty: "—", total: remainingDiscountPart });
      }
      if (remainingAdvancePart >= 0.1) {
        items.push({ desc: "Credit or Advance Received", subDesc: "Added to account balance", date: formatDate(payment.date), qty: "—", total: remainingAdvancePart });
      }
    }

    return items;
  };

  const selectedPaymentItems = useMemo(() => getPaymentItems(selectedPayment), [selectedPayment, subscribers, plans, invoices, payments]);
  const getLinkedInvoice = (payment: any) => {
    if (!payment) return null;
    if (payment.invoiceId) {
      const linkedInvoice = invoices.find((inv) => inv.id === payment.invoiceId);
      if (linkedInvoice) return linkedInvoice;
    }
    return invoices
      .filter((inv) => inv.subscriberId === payment.subscriberId)
      .sort((a, b) => Math.abs(new Date(a.date).getTime() - new Date(payment.date).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(payment.date).getTime()))[0] || null;
  };
  const selectedPaymentServiceDates = useMemo(() => {
    if (!selectedPayment) return { rechargeDate: "", expiryDate: "" };
    const subscriber = subscribers.find((sub) => sub.id === selectedPayment.subscriberId);
    const linkedInvoice = getLinkedInvoice(selectedPayment);
    return linkedInvoice ? getInvoiceServiceDates(linkedInvoice, subscriber, plans) : { rechargeDate: "", expiryDate: "" };
  }, [selectedPayment, subscribers, invoices, plans]);
  const paymentReceiptInvoice = useMemo(
    () => getLinkedInvoice(selectedPayment),
    [selectedPayment, invoices]
  );
  
  const [formData, setFormData] = useState({
    subscriberId: "",
    amount: 0,
    method: "cash" as "cash" | "upi",
  });

  const [filterMonth, setFilterMonth] = useState<number | "all">(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | "all">(new Date().getFullYear());
  const [filterEndMonth, setFilterEndMonth] = useState<number | "all">(new Date().getMonth());
  const [filterEndYear, setFilterEndYear] = useState<number | "all">(new Date().getFullYear());
  const [areaF, setAreaF] = useState<string>("all");
  const [methodF, setMethodF] = useState<string>("all");

  // Filter validation
  useEffect(() => {
    if (filterMonth !== "all" && filterYear !== "all" && filterEndMonth !== "all" && filterEndYear !== "all") {
      const start = Number(filterYear) * 12 + Number(filterMonth);
      const end = Number(filterEndYear) * 12 + Number(filterEndMonth);
      if (end < start) {
        setFilterEndMonth(filterMonth);
        setFilterEndYear(filterYear);
        toast.error("End period cannot be before start period");
      }
    }
  }, [filterMonth, filterYear, filterEndMonth, filterEndYear]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2024, 2025, 2026, 2027, 2028, 2029];
  
  const areas = useMemo(() => {
    const set = new Set<string>();
    subscribers.forEach(s => { if (s.area) set.add(s.area); });
    return Array.from(set).sort();
  }, [subscribers]);

  const filtered = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    return payments.filter((p) => {
      const sub = subscribers.find(s => s.id === p.subscriberId);
      
      const matchQ = tokens.length === 0 || tokens.every(token => {
        return (
          (sub?.name || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (sub?.area || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (sub?.id || "").toLowerCase().includes(token) ||
          (sub?.customerNo?.toString() || "").toLowerCase().includes(token) ||
          (sub?.phone || "").includes(token) ||
          (p.id || "").toLowerCase().includes(token) ||
          (p.method || "").toLowerCase().replace(/\s+/g, ' ').includes(token)
        );
      });

      const payDate = new Date(p.date);
      const payTime = payDate.getFullYear() * 12 + payDate.getMonth();
      
      const startMonth = filterMonth === "all" ? 0 : filterMonth;
      const startYear = filterYear === "all" ? 0 : filterYear;
      const startTime = filterYear === "all" ? -1 : startYear * 12 + startMonth;
      
      const endMonthVal = filterEndMonth === "all" ? 11 : filterEndMonth;
      const endYearVal = filterEndYear === "all" ? 9999 : filterEndYear;
      const endTime = filterEndYear === "all" ? 999999 : endYearVal * 12 + endMonthVal;

      const matchPeriod = filterMonth === "all" || (payTime >= startTime && payTime <= endTime);
      const matchArea = areaF === "all" || sub?.area === areaF;
      const matchMethod = methodF === "all" || p.method === methodF;

      return matchQ && matchPeriod && matchArea && matchMethod;
    });
  }, [q, payments, subscribers, filterMonth, filterYear, filterEndMonth, filterEndYear, areaF, methodF]);

  const sorted = [...filtered].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriberId || formData.amount <= 0) {
      toast.error("Please select a subscriber and enter a valid amount");
      return;
    }

    try {
      setIsSubmitting(true);
      const newPay = await recordPayment({
        subscriberId: formData.subscriberId,
        amount: formData.amount,
        method: formData.method === "cash" ? "Cash" : "UPI",
        date: new Date().toISOString(),
        agent: "Chudasama Shaktisinh", 
      });
      toast.success("Payment recorded successfully");
      setIsAddOpen(false);
      setFormData({ subscriberId: "", amount: 0, method: "cash" });
      
      // Auto-open receipt
      setSelectedPayment(newPay);
      setIsReceiptOpen(true);
    } catch (err) {
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPayment = async (data: any) => {
    try {
      setIsSubmitting(true);
      const newPay = await recordPayment({
        subscriberId: data.subscriberId,
        amount: data.amount,
        method: data.method === "cash" ? "Cash" : "UPI",
        date: new Date().toISOString(),
        agent: "Chudasama Shaktisinh",
      });
      toast.success("Payment recorded successfully");
      setIsAddOpen(false);
      setSelectedPayment(newPay);
      setIsReceiptOpen(true);
    } catch (err) {
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({ type: 'delete', id });
  };

  const executeDelete = async (id: string) => {
    try {
      await deletePayment(id);
      toast.success("Payment record deleted");
    } catch (e) {
      toast.error("Failed to delete payment");
    }
  };
  const handleWhatsApp = (p: any) => {
    const sub = subscribers.find(s => s.id === p.subscriberId);
    if (!sub?.phone) {
      toast.error("Subscriber phone number not found");
      return;
    }
    
    const cleanPhone = sub.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Detect if this payment is for a legacy invoice
    const isLegacyPayment = invoices.some(inv =>
      inv.subscriberId === p.subscriberId &&
      inv.type === 'legacy' &&
      (inv.amount === p.amount || Math.abs(new Date(inv.date).getTime() - new Date(p.date).getTime()) < 2 * 24 * 60 * 60 * 1000)
    );
    
    const items = getPaymentItems(p);
    const coverageStr = items.map(it => it.desc).join(', ');
    const linkedInvoice = getLinkedInvoice(p);
    const serviceDates = linkedInvoice ? getInvoiceServiceDates(linkedInvoice, sub, plans) : { rechargeDate: "", expiryDate: "" };
    const servicePeriod = linkedInvoice?.billingPeriod || "";
    
    const message = isLegacyPayment
      ? `*PAYMENT RECEIPT - PREVIOUS YEAR BILLING*
Hello ${sub.name},
We have successfully received your payment for previous year dues.

*Receipt No:* ${p.id}
*Description:* Previous Year Billing / Previous Dues
*Amount Paid:* Rs. ${p.amount}
*Method:* ${p.method}
*Coverage:* ${coverageStr}
*Date:* ${formatDate(p.date)}

Thank you for choosing ${brand.name}!`
      : `*PAYMENT RECEIPT*
Hello ${sub.name},
We have successfully received your payment.

*Receipt No:* ${p.id}
*Amount Paid:* Rs. ${p.amount}
${p.discount > 0 ? `*Discount:* Rs. ${p.discount}\n` : ''}${servicePeriod ? `*Service Period:* ${servicePeriod}\n` : ''}${serviceDates.expiryDate ? `*Expiry Date:* ${formatDate(serviceDates.expiryDate)}\n` : ''}*Method:* ${p.method}
*Coverage:* ${coverageStr}
*Date:* ${formatDate(p.date)}

*New Balance:* Rs. ${sub.balance}

Thank you for choosing ${brand.name}!`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareReceipt = async () => {
    const element = document.getElementById("receipt-content");
    if (!element) {
      toast.error("Receipt document not ready. Please try again.");
      return;
    }

    if (!window.isSecureContext) {
      toast.error("Sharing is only available on secure (HTTPS) connections.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Generating official receipt...");
    const fileName = `${selectedPayment?.id}.pdf`;

    try {
      const html2pdf = await loadHtml2Pdf();
      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          windowWidth: 794,
          onclone: (doc: Document) => {
            const el = doc.getElementById("receipt-content");
            if (el) {
              el.style.transform = "none";
              el.style.margin = "0";
              el.style.padding = "40px";
              el.style.width = "794px";
              el.style.backgroundColor = "white";
              el.style.color = "black";
              const allText = el.querySelectorAll('*');
              allText.forEach((node: any) => {
                if (node.style) {
                  node.style.color = "black";
                  node.style.borderColor = "#eee";
                }
              });
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF as blob
      const pdfBlob = await html2pdf().set(opt).from(element).toPdf().output('blob');
      
      if (!pdfBlob || pdfBlob.size < 1000) {
        throw new Error("Receipt generation failed.");
      }

      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const sub = subscribers.find(s => s.id === selectedPayment.subscriberId);
      const items = getPaymentItems(selectedPayment);
      const coverageStr = items.map(it => it.desc).join(', ');
      const linkedInvoice = getLinkedInvoice(selectedPayment);
      const serviceDates = linkedInvoice ? getInvoiceServiceDates(linkedInvoice, sub, plans) : { rechargeDate: "", expiryDate: "" };
      const servicePeriod = linkedInvoice?.billingPeriod || "";
      
      const message = `*PAYMENT RECEIPT: ${selectedPayment.id}*
Hello ${sub?.name || 'Customer'},
We have successfully received your payment of Rs. ${selectedPayment.amount}${selectedPayment.discount > 0 ? ` with a discount of Rs. ${selectedPayment.discount}` : ''}.

*Method:* ${selectedPayment.method}
*Coverage:* ${coverageStr}
*Date:* ${formatDate(selectedPayment.date)}
${servicePeriod ? `*Service Period:* ${servicePeriod}\n` : ''}${serviceDates.expiryDate ? `*Expiry Date:* ${formatDate(serviceDates.expiryDate)}\n` : ''}
*New Balance:* Rs. ${sub?.balance || 0}

Thank you!`;

      // Use navigator.share ONLY on mobile for file sharing
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      const canShareFile = isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          // Attempt to share both file and text
          await navigator.share({
            files: [file],
            title: `Receipt ${selectedPayment.id}`,
            text: message
          });
          toast.dismiss(toastId);
          toast.success("Receipt and message shared successfully!");
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            toast.dismiss(toastId);
            toast.info("Sharing cancelled");
          } else {
            throw shareErr;
          }
        }
      } else {
        // Fallback for Desktop: Browsers CANNOT auto-attach files.
        // We download and open WhatsApp Web directly.
        const { saveAs } = await import('file-saver');
        saveAs(pdfBlob, fileName);
        
        // Find phone number for direct link
        const sub = subscribers.find(s => s.id === selectedPayment.subscriberId);
        const cleanPhone = sub?.phone?.replace(/\D/g, '') || '';
        const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        
        // Use a direct WhatsApp Web link if possible for Desktop
        const isDesktop = !/Android|iPhone|iPad/i.test(navigator.userAgent);
        const waBase = isDesktop ? "https://web.whatsapp.com/send" : "https://wa.me";
        const whatsappUrl = `${waBase}/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp immediately to avoid popup blockers
        const waWindow = window.open(whatsappUrl, '_blank');
        
        if (!waWindow) {
          toast.error("Popup blocked! Please allow popups for this site to open WhatsApp.");
        }
        
        toast.dismiss(toastId);
        toast.success("Receipt downloaded! Please drag it into the WhatsApp window.", {
          duration: 10000,
        });
      }
    } catch (err: any) {
      console.error("Sharing error:", err);
      toast.dismiss(toastId);
      toast.error(`Error: ${err.message || "Could not generate receipt"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    const element = contentRef.current;
    if (!element) {
      toast.error("Receipt content not found. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const options = {
        margin: [0, 0],
        filename: `Receipt_${selectedPayment.receiptNumber || selectedPayment.id || 'REC'}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          windowWidth: 794,
          logging: false,
          onclone: (doc: Document) => {
            const el = doc.getElementById("receipt-content");
            if (el) {
              el.style.transform = "none";
              el.style.margin = "0";
              el.style.padding = "40px";
              el.style.width = "794px";
              el.style.backgroundColor = "white";
              el.style.color = "black";
              const allText = el.querySelectorAll('*');
              allText.forEach((node: any) => {
                if (node.style) {
                  node.style.color = "black";
                  node.style.borderColor = "#eee";
                }
              });
            }
          }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(options).from(element).save();
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error("Receipt generation error:", error);
      toast.error("Failed to generate PDF receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setIsReceiptOpen(true);
  };

  const getAllocationItems = (payment: any) => {
    const items = getPaymentItems(payment);
    if (items.length === 0) return [{ label: "Advance Credit", type: 'advance' }];
    
    const results = items.map(item => {
      let label = item.desc;
      let type = 'legacy';
      if (item.desc === "Monthly Subscription") {
        label = item.subDesc.replace("Subscription for ", "");
        type = 'plan';
      }
      return { label, type };
    });

    // Deduplicate by label
    const unique = [];
    const seen = new Set();
    for (const res of results) {
      if (!seen.has(res.label)) {
        seen.add(res.label);
        unique.push(res);
      }
    }
    return unique;
  };

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + Number(p.amount), 0);
  const upiTotal = filtered.filter(p => p.method !== 'Cash').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary/30 selection:text-white">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div className="h-1 w-12 bg-slate-800 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Financial Ledger</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
              Payment <span className="text-primary italic">History</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
              Real-time transaction tracking and receipt management. Monitor all incoming revenue with precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => { setIsGlobalRefreshing(true); refreshData().finally(() => setIsGlobalRefreshing(false)); }} className="h-14 px-6 rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-300 transition-all duration-300">
              <Activity className={cn("h-4 w-4 mr-2 text-primary", isGlobalRefreshing && "animate-spin")} />
              Sync Ledger
            </Button>
            <Button onClick={() => setIsAddOpen(true)} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="h-5 w-5 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-2 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <Input placeholder="Search records by name, area, ID or method..." className="h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 focus:border-primary/50 focus:ring-primary/20 rounded-2xl text-white placeholder:text-slate-600 font-medium transition-all" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select value={areaF} onChange={(e) => setAreaF(e.target.value)} className="w-full h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 rounded-2xl text-white font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-slate-900">
              <option value="all" className="bg-slate-900">All Areas</option>
              {areas.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
            </select>
          </div>

          <div className="relative">
            <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select value={methodF} onChange={(e) => setMethodF(e.target.value)} className="w-full h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 rounded-2xl text-white font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-slate-900">
              <option value="all" className="bg-slate-900">All Methods</option>
              <option value="Cash" className="bg-slate-900">Cash Payments</option>
              <option value="UPI" className="bg-slate-900">UPI / Digital</option>
            </select>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-10 p-6 bg-slate-900/30 border border-slate-800/50 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3">From</span>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-white uppercase px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all" className="bg-slate-900">Start Month</option>
              {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-white uppercase px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
              {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>
          
          <div className="h-px w-8 bg-slate-800 hidden sm:block" />
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3">To</span>
            <select value={filterEndMonth} onChange={(e) => setFilterEndMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-white uppercase px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all" className="bg-slate-900">End Month</option>
              {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m}</option>)}
            </select>
            <select value={filterEndYear} onChange={(e) => setFilterEndYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-white uppercase px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
              {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>

          <div className="ml-auto hidden lg:flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{sorted.length} Entries Found</span>
          </div>
        </div>

        {/* Main Records Table */}
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-black/20 overflow-hidden mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2.5 px-6 pb-6">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                  <th className="px-6 py-6">Transaction</th>
                  <th className="px-6 py-6">Account Holder</th>
                  <th className="px-6 py-6 text-center">Status</th>
                  <th className="px-6 py-6">Payment Info</th>
                  <th className="px-6 py-6 text-right">Value</th>
                  <th className="px-6 py-6 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Accessing secure database...</p>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <AlertCircle className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No payment records match your filters</p>
                    </td>
                  </tr>
                ) : sorted.map((p) => {
                  const sub = subscribers.find(s => s.id === p.subscriberId);
                  return (
                    <tr key={p.id} className="group bg-slate-950/40 border border-slate-800/50 hover:bg-slate-900 transition-all duration-300 rounded-2xl">
                      <td className="px-6 py-5 first:rounded-l-2xl border-y border-l border-slate-800/50 group-hover:bg-slate-950/30">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center transition-all shadow-inner border",
                            p.method === 'UPI' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          )}>
                            {p.method === 'UPI' ? <CreditCard className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-mono-num font-black text-xs text-white">#{p.id.slice(-6).toUpperCase()}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-bold mt-1 tracking-wider">{formatDate(p.date)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-800/50 group-hover:bg-slate-950/30">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">#{sub?.customerNo}</span>
                            <span className="text-sm font-black text-white tracking-tight"><Highlight text={sub?.name || "Unknown User"} query={q} /></span>
                          </div>
                          <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            <Highlight text={sub?.area || "Unspecified Area"} query={q} />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-800/50 group-hover:bg-slate-950/30 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase border border-emerald-500/20 shadow-inner">
                          <CheckCircle2 className="h-3 w-3" />
                          Successful
                        </span>
                      </td>
                      <td className="px-6 py-5 border-y border-slate-800/50 group-hover:bg-slate-950/30">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded border shadow-inner",
                              p.method === 'UPI' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            )}>{p.method}</span>
                            <span className="text-[9px] font-bold text-slate-500">{p.agent}</span>
                          </div>
                          {p.reference && <span className="text-[9px] font-mono text-slate-600 truncate max-w-[120px]">REF: {p.reference}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right border-y border-slate-800/50 group-hover:bg-slate-950/30">
                        <p className="font-mono-num font-black text-sm text-white">{formatCurrency(p.amount)}</p>
                        {p.discount > 0 && <p className="text-[9px] text-primary font-black uppercase mt-1 tracking-tighter">Save: {formatCurrency(p.discount)}</p>}
                      </td>
                      <td className="px-6 py-5 last:rounded-r-2xl border-y border-r border-slate-800/50 group-hover:bg-slate-950/30">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white" title="View Receipt" onClick={() => handleOpenReceipt(p)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 text-primary rounded-xl" title="Share Receipt" onClick={() => handleWhatsApp(p)}><Share2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-rose-500/10 text-rose-500 rounded-xl" title="Delete Record" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">Record <span className="text-primary italic">Payment</span></h2>
              <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="rounded-xl hover:bg-slate-800"><X className="h-5 w-5" /></Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subscriber</Label>
                  <select value={formData.subscriberId} onChange={(e) => setFormData({ ...formData, subscriberId: e.target.value })} className="w-full h-14 rounded-xl border border-slate-800 bg-slate-950 px-4 font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm">
                    <option value="" className="bg-slate-900">Search for subscriber...</option>
                    {subscribers.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900">#{s.customerNo} - {s.name} ({s.area})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                      <Input type="number" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} className="h-14 pl-8 bg-slate-950 border-slate-800 rounded-xl font-bold text-white" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Method</Label>
                    <div className="flex gap-2">
                      {(["Cash", "UPI"] as const).map(m => (
                        <button key={m} type="button" onClick={() => setFormData({ ...formData, method: m })} className={cn(
                          "flex-1 h-14 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                          formData.method === m ? "bg-primary border-primary text-white" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-white"
                        )}>{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorize Transaction"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && selectedPayment && (
        <PaymentReceiptModal 
          isOpen={isReceiptOpen} 
          onClose={() => setIsReceiptOpen(false)} 
          payment={selectedPayment} 
          subscriber={subscribers.find(s => s.id === selectedPayment.subscriberId)}
          contentRef={contentRef}
          onDownload={handleDownloadReceipt}
          onShare={handleWhatsApp}
          isGenerating={isSubmitting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6">
            <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
              <Trash2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white">Irreversible Action</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">This payment record will be permanently purged from the ledger. This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-800" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button className="flex-1 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20" onClick={() => { if (confirmModal?.id) deletePayment(confirmModal.id); setConfirmModal(null); }}>Delete Record</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentReceiptModal = ({ isOpen, onClose, payment, subscriber, contentRef, onDownload, onShare, isGenerating }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-8">
        <div className="bg-white rounded-[3rem] shadow-2xl relative overflow-hidden text-slate-900">
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-6 rounded-full text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></Button>
          
          <div id="receipt-content" ref={contentRef} className="p-10 space-y-8 bg-white">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border-4 border-white shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase">Payment Success</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref No: {payment.id?.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Received</p>
              <p className="text-5xl font-black tracking-tighter">₹{payment.amount}</p>
              <div className="mt-6 pt-6 border-t border-slate-200/60 grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                  <p className="text-sm font-bold truncate">{subscriber?.name}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Method</p>
                  <p className="text-sm font-bold">{payment.method}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-400">Date</span>
                <span>{new Date(payment.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-400">Account No</span>
                <span>#{subscriber?.customerNo}</span>
              </div>
              {payment.reference && (
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400">Reference</span>
                  <span className="font-mono">{payment.reference}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-10 pt-0 flex flex-col gap-3">
            <Button onClick={() => onShare(payment)} className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5c] text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3">
              <Share2 className="h-5 w-5" /> Share on WhatsApp
            </Button>
            <Button variant="outline" onClick={onDownload} disabled={isGenerating} className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-slate-50">
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              {isGenerating ? "Processing..." : "Download Receipt"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Label = ({ children, className, ...props }: any) => <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props}>{children}</label>;
