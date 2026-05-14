import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Search, Receipt, Wallet, CreditCard, Banknote, Filter, Loader2, Trash2, Download, Eye, X, MapPin, Phone, Wifi, Check, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBilling } from "@/context/BillingContext";
import { Logo } from "@/components/Logo";
import { getInvoiceServiceDates } from "@/components/invoice/invoicePreviewUtils";
import { toast } from "sonner";
import { BRAND_DISPLAY_NAME, getBrandSettings } from "@/lib/branding";

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
  const { payments, subscribers, plans, invoices, recordPayment, deletePayment, isLoading, companySettings } = useBilling();
  const brand = getBrandSettings(companySettings);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{type: 'delete', id: string} | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
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

    if (showReceipt) {
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
  }, [showReceipt]);
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

    setIsSubmitting(true);
    try {
      const newPay = await recordPayment({
        subscriberId: formData.subscriberId,
        amount: formData.amount,
        method: formData.method === "cash" ? "Cash" : "UPI",
        date: new Date().toISOString(),
        agent: "Chudasama Shaktisinh", 
      });
      toast.success("Payment recorded successfully");
      setShowForm(false);
      setFormData({ subscriberId: "", amount: 0, method: "cash" });
      
      // Auto-open receipt
      setSelectedPayment(newPay);
      setShowReceipt(true);
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
          onclone: (doc: Document) => {
            const clonedElement = doc.getElementById("receipt-content");
            if (clonedElement) {
              clonedElement.style.transform = "none";
              clonedElement.style.margin = "0";
              clonedElement.style.width = "794px";
              clonedElement.style.height = "auto";
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
      const opt = {
        margin: [0, 0],
        filename: `Receipt_${selectedPayment.receiptNumber || selectedPayment.id || 'REC'}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 794,
          logging: false,
          onclone: (doc: Document) => {
            const clonedElement = doc.getElementById("receipt-content");
            if (clonedElement) {
              clonedElement.style.transform = "none";
              clonedElement.style.margin = "0";
              clonedElement.style.width = "794px";
              clonedElement.style.height = "auto";
            }
          }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
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
    setShowReceipt(true);
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

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + p.amount, 0);
  const upiTotal = filtered.filter(p => p.method === 'UPI').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white uppercase italic">Collection <span className="text-primary not-italic">Ledger</span></h1>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-4">{filtered.length} high-fidelity transactions found</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="h-12 px-6 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-slate-950 rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-1 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Search Transaction</span>
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                    placeholder="Search by name, area, ID, or receipt #..." 
                    className="pl-12 pr-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-slate-600 font-medium" 
                  />
                  {q && (
                    <button 
                      onClick={() => setQ("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

                  <div className="w-full sm:w-48 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <CreditCard className="w-2.5 h-2.5" /> Method
                </label>
                <select 
                  value={methodF} 
                  onChange={(e) => setMethodF(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-xs transition-all hover:bg-white/10"
                >
                  <option value="all" className="bg-slate-900">All Methods</option>
                  <option value="Cash" className="bg-slate-900">CASH</option>
                  <option value="UPI" className="bg-slate-900">UPI</option>
                </select>
              </div>

              <div className="w-full sm:w-48 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <MapPin className="w-2.5 h-2.5" /> Address Filter
                </label>
                <select 
                  value={areaF} 
                  onChange={(e) => setAreaF(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-xs transition-all hover:bg-white/10"
                >
                  <option value="all" className="bg-slate-900">All Addresses</option>
                  {areas.map(a => (
                    <option key={a} value={a} className="bg-slate-900">{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[450px] space-y-6 pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-10">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Collection Period Filter</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">From Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={filterMonth} 
                      onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-xs"
                    >
                      <option value="all" className="bg-slate-900">All Months</option>
                      {months.map((m, i) => (
                        <option key={m} value={i} className="bg-slate-900">{m}</option>
                      ))}
                    </select>
                    <select 
                      value={filterYear} 
                      onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-xs"
                    >
                      <option value="all" className="bg-slate-900">All Years</option>
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">To Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={filterEndMonth} 
                      onChange={(e) => setFilterEndMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-xs"
                      disabled={filterMonth === "all"}
                    >
                      <option value="all" className="bg-slate-900">All Months</option>
                      {months.map((m, i) => (
                        <option key={m} value={i} className="bg-slate-900">{m}</option>
                      ))}
                    </select>
                    <select 
                      value={filterEndYear} 
                      onChange={(e) => setFilterEndYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none text-xs"
                      disabled={filterYear === "all"}
                    >
                      <option value="all" className="bg-slate-900">All Years</option>
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-7 flex items-center gap-6 border border-emerald-500/20 shadow-2xl transition-all hover:scale-[1.02] duration-300 ring-1 ring-emerald-500/10 group">
          <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
            <Wallet className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-black">Cash Collection</p>
            <p className="text-4xl font-black font-mono-num tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mt-1">{formatCurrency(cashTotal)}</p>
          </div>
        </div>
        
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-7 flex items-center gap-6 border border-blue-500/20 shadow-2xl transition-all hover:scale-[1.02] duration-300 ring-1 ring-blue-500/10 group">
          <div className="h-16 w-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-blue-400 font-black">UPI Collection</p>
            <p className="text-4xl font-black font-mono-num tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] mt-1">{formatCurrency(upiTotal)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[1.5rem] overflow-hidden border-border/40 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black border-b border-border/60">
                <th className="px-6 py-5 font-black">Transaction</th>
                <th className="px-6 py-5 font-black">Subscriber</th>
                <th className="px-6 py-5 font-black">Allocation</th>
                <th className="px-6 py-5 font-black">Method</th>
                <th className="px-6 py-5 font-black">Date & Time</th>
                <th className="px-6 py-5 text-right font-black">Amount</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 opacity-20" />
                    <p className="font-medium italic">Loading payment history...</p>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground font-medium italic">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                sorted.map((p) => {
                  const sub = subscribers.find(s => s.id === p.subscriberId);
                  const showRecordedAt = p.createdAt && formatDate(p.createdAt) !== formatDate(p.date);

                  return (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${p.method === 'UPI' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            <Receipt className="h-4 w-4" />
                          </div>
                          <span className="font-mono-num font-black text-[11px] uppercase text-muted-foreground tracking-tighter">
                            <Highlight text={p.id} query={q} />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-foreground">
                            <Highlight text={sub?.name || "Unknown"} query={q} />
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                              <Highlight text={sub?.area || "N/A"} query={q} />
                            </span>
                            {sub && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-black uppercase">
                              {plans.find(p => p.id === sub.planId)?.name} @ {formatCurrency(plans.find(p => p.id === sub.planId)?.price || 0)}/mo
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {getAllocationItems(p).map((item, idx) => (
                            <span 
                              key={idx}
                              className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-l-4 shadow-md transition-all hover:translate-x-1 cursor-default ${
                                item.type === 'advance' 
                                  ? 'bg-blue-950/80 text-blue-400 border-blue-500 shadow-blue-500/10' 
                                  : item.type === 'plan'
                                    ? 'bg-slate-900 text-emerald-400 border-emerald-500 shadow-emerald-500/10'
                                    : 'bg-slate-900 text-amber-400 border-amber-500 shadow-amber-500/10'
                              }`}
                            >
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {p.method === 'UPI' ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                              <CreditCard className="h-3 w-3" /> UPI
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                              <Banknote className="h-3 w-3" /> Cash
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-muted-foreground font-mono-num">{formatDate(p.date)}</span>
                          {showRecordedAt && (
                            <div className="flex items-center gap-1 mt-1 bg-slate-900/80 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md shadow-lg shadow-rose-950/20 backdrop-blur-sm">
                              <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">Recorded: {formatDate(p.createdAt)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono-num font-black text-sm text-emerald-600">+{formatCurrency(p.amount)}</span>
                          {p.discount > 0 && (
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                              -{formatCurrency(p.discount)} Disc.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-all"
                          onClick={() => handleWhatsApp(p)}
                          title="Share on WhatsApp"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" 
                          onClick={() => {
                            setSelectedPayment(p);
                            setShowReceipt(true);
                          }}
                          title="View Receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl hover:bg-rose-100 text-rose-500 transition-all" 
                            onClick={() => handleDelete(p.id)}
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Receipt Preview Modal */}
      {showReceipt && selectedPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 ring-1 ring-white/5">
            <div className="overflow-y-auto flex-1">
              <div id="receipt-content" ref={contentRef} className="bg-white min-h-full flex flex-col text-slate-900 font-sans">
                {/* Header Section */}
                <div className="p-10 border-b-8 border-[#06b6d4] bg-slate-900">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-[#06b6d4]/20 flex items-center justify-center border border-[#06b6d4]/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Wifi className="h-8 w-8 text-[#06b6d4]" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">{brand.name}</h1>
                        <div className="flex items-center gap-2 text-[#06b6d4]/60 text-[10px] font-black uppercase tracking-widest mt-1">
                          <MapPin className="h-3 w-3" /> <span>{brand.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#06b6d4]/60 text-[10px] font-black uppercase tracking-widest mt-0.5">
                          <Phone className="h-3 w-3" /> <span>{brand.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="inline-block px-4 py-1.5 bg-[#06b6d4] text-slate-900 font-black text-[10px] rounded-full mb-3 uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        PAYMENT RECEIPT
                      </div>
                      <p className="text-2xl font-black text-white tracking-tighter leading-none">{selectedPayment.id.slice(-8).toUpperCase()}</p>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">{formatDate(selectedPayment.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-10 flex-1 flex flex-col bg-white">
                  {/* Success Banner */}
                  <div className="flex items-center gap-6 mb-12 p-8 bg-emerald-50 rounded-3xl border border-emerald-100/50 shadow-inner">
                    <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-[0_10px_20px_rgba(16,185,129,0.3)]">
                      <Check className="h-9 w-9 stroke-[3px]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-emerald-900 leading-tight uppercase tracking-tight">Payment Successful</h2>
                      <p className="text-emerald-700 font-bold mt-1 text-sm opacity-80">High-fidelity transaction processed and recorded on {formatDate(selectedPayment.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Subscriber Entity</p>
                      <p className="text-xl font-black text-slate-900 tracking-tight">{subscribers.find(s => s.id === selectedPayment.subscriberId)?.name || "Customer"}</p>
                      <p className="text-[11px] text-slate-500 mt-2 font-bold uppercase tracking-wider leading-relaxed">
                        ID: <span className="text-slate-900 font-black ml-1">{subscribers.find(s => s.id === selectedPayment.subscriberId)?.customerNo || selectedPayment.subscriberId || "N/A"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        Address: <span className="text-slate-900 font-black ml-1">{subscribers.find(s => s.id === selectedPayment.subscriberId)?.area || "N/A"}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Transaction Meta</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-bold uppercase tracking-wider leading-relaxed">
                        Method: <span className="text-slate-900 font-black ml-1">{selectedPayment.method || "Cash"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        Date: <span className="text-slate-900 font-black ml-1">{formatDate(selectedPayment.date)}</span>
                      </p>
                      {paymentReceiptInvoice?.billingPeriod && (
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                          Service: <span className="text-slate-900 font-black ml-1">{paymentReceiptInvoice.billingPeriod}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                        Agent: <span className="text-slate-900 font-black ml-1">{selectedPayment.agent || "Office"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Transaction Table */}
                  <div className="flex-1">
                    <table className="w-full mb-10">
                      <thead>
                        <tr className="border-b-2 border-slate-200 bg-slate-50">
                          <th className="text-left py-4 px-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Service Description</th>
                          <th className="text-center py-4 px-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Period</th>
                          <th className="text-right py-4 px-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Settled Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPaymentItems.map((item, idx) => (
                          <tr key={idx} className="group">
                            <td className="py-6 px-5">
                              <p className="font-black text-slate-900 text-sm tracking-tight">{item.desc}</p>
                              <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider">{item.subDesc}</p>
                            </td>
                            <td className="py-6 px-5 text-center text-slate-600 font-black text-[11px] tracking-wider font-mono-num">{item.date}</td>
                            <td className="py-6 px-5 text-right font-black text-slate-900 text-sm font-mono-num">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end mb-12">
                      <div className="w-80 bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Prior Balance</span>
                          <span className="text-slate-900 font-black text-xs font-mono-num">
                            {formatCurrency((selectedPayment.balanceAtPayment !== undefined ? selectedPayment.balanceAtPayment : (subscribers.find(s => s.id === selectedPayment.subscriberId)?.balance || 0)) - Number(selectedPayment.amount) - Number(selectedPayment.discount || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 opacity-60">
                          <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Applied Credit</span>
                          <span className="text-slate-900 font-black text-xs font-mono-num">{formatCurrency(Number(selectedPayment.amount) + Number(selectedPayment.discount || 0))}</span>
                        </div>
                        {selectedPayment.discount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-rose-500 text-[9px] font-black uppercase tracking-[0.2em]">Waiver</span>
                            <span className="text-rose-600 font-black text-xs font-mono-num">-{formatCurrency(selectedPayment.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
                          <span className="text-[#06b6d4] text-[10px] font-black uppercase tracking-[0.25em]">Total Received</span>
                          <span className="text-[#06b6d4] font-black text-2xl tracking-tighter font-mono-num">{formatCurrency(selectedPayment.amount)}</span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-black text-[10px] uppercase tracking-wider">Closing Balance</span>
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Live Account Status</span>
                          </div>
                          <span className={`text-xl font-black font-mono-num tracking-tighter ${(selectedPayment.balanceAtPayment !== undefined ? selectedPayment.balanceAtPayment : (subscribers.find(s => s.id === selectedPayment.subscriberId)?.balance || 0)) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatCurrency(selectedPayment.balanceAtPayment !== undefined ? selectedPayment.balanceAtPayment : (subscribers.find(s => s.id === selectedPayment.subscriberId)?.balance || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-10 border-t border-slate-100 text-center">
                    <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em] mb-4">Digitally Signed & Validated Transaction</p>
                    <div className="bg-slate-900 py-3 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-xl">
                      {brand.name} Systems Infrastructure
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-900 border-t border-white/5 flex gap-4">
              <Button 
                onClick={() => setShowReceipt(false)}
                variant="ghost" 
                className="flex-1 h-16 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-all"
              >
                Close
              </Button>
              <Button 
                onClick={() => handleDownloadReceipt(selectedPayment)}
                disabled={isSubmitting}
                className="flex-1 h-16 rounded-2xl bg-[#06b6d4] text-slate-900 hover:glow-primary font-black text-xs uppercase tracking-widest transition-all gap-3"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md p-8 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/5">
            <h2 className="text-2xl font-black mb-2 text-white tracking-tight">Delete Payment</h2>
            <p className="text-slate-400 mb-8 font-medium leading-relaxed">
              Are you sure you want to delete this payment record? This will deduct the payment amount from the subscriber's balance.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="ghost" 
                className="rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 h-12 px-6" 
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest transition-all"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




