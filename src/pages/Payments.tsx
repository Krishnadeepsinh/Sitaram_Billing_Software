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
    return unique;
  };

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + p.amount, 0);
  const upiTotal = filtered.filter(p => p.method !== 'Cash').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-black mb-2 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Financial Records · Secure
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            Revenue <span className="text-primary italic">Collection</span>
          </h1>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            Track and record {activeBusinessMode === "cable" ? "Cable" : "Broadband"} customer payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="h-11 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2.5 text-slate-600" 
            onClick={async () => {
              setIsGlobalRefreshing(true);
              try {
                await refreshData();
                toast.success("Payments Synchronized");
              } finally {
                setIsGlobalRefreshing(false);
              }
            }}
          >
            <Loader2 className={cn("h-3.5 w-3.5", isGlobalRefreshing && "animate-spin")} />
            Sync
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2.5"
          >
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-all duration-300" />
            <Input
              placeholder="Search subscriber name, phone, or transaction ID..."
              className="pl-10 bg-slate-50 border-transparent rounded-xl h-11 focus:bg-white focus:ring-primary/10 transition-all text-[11px] font-bold placeholder:text-slate-400"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button 
                onClick={() => setQ("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <select 
                className="bg-transparent border-none rounded-lg h-9 px-3 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-all min-w-[120px] cursor-pointer text-slate-600"
                value={methodF}
                onChange={(e) => setMethodF(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="GPay">GPay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Other">Other</option>
              </select>
              <div className="w-px h-3 bg-slate-200" />
              <select 
                className="bg-transparent border-none rounded-lg h-9 px-3 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-all min-w-[120px] cursor-pointer text-slate-600"
                value={areaF}
                onChange={(e) => setAreaF(e.target.value)}
              >
                <option value="all">All Areas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <Input
                type="date"
                className="bg-transparent border-none h-9 px-3 text-[10px] font-black w-[130px] focus:ring-0 cursor-pointer text-slate-600"
                value={dateF}
                onChange={(e) => setDateF(e.target.value)}
              />
              {dateF && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg text-slate-400"
                  onClick={() => setDateF("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:border-emerald-200 group">
          <div className="h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Cash Collection</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(cashTotal)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:border-primary/20 group">
          <div className="h-14 w-14 rounded-xl bg-primary/5 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">Digital Revenue</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(upiTotal)}</p>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Subscriber</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Date & Time</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction ID</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Method</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const sub = subscribers.find(s => s.id === p.subscriberId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-display font-black text-[11px] text-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                          {sub?.customerNo || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight text-slate-900">{sub?.name || "Deleted Sub"}</p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3 w-3" /> {sub?.area || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{formatDate(p.date)}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Recorded at {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                          <span className="text-[10px] font-mono font-bold text-slate-500">{p.id}</span>
                        </div>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono-num font-black text-sm bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                        {formatCurrency(p.amount)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        p.method === 'Cash' ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-primary/5 text-primary border-primary/10"
                      )}>
                        {p.method}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                          onClick={() => handleShareReceipt(p)}
                          title="Share Receipt"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          onClick={() => handleDelete(p.id)}
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm italic">
                    No payment records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPaymentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={async (payment) => {
          await addPayment(payment);
          setIsAddOpen(false);
          toast.success("Payment recorded successfully");
        }}
        subscribers={subscribers}
      />

      {selectedPayment && (
        <PaymentReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          payment={selectedPayment}
          subscriber={subscribers.find(s => s.id === selectedPayment.subscriberId)!}
        />
      )}
    </div>
  );
};

export default Payments;

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
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




