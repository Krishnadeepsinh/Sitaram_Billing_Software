import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, Receipt, Wallet, Banknote, Filter, Loader2, 
  Trash2, Download, Eye, X, Activity, Share2, Smartphone, 
  AlertCircle, Check, Smartphone as PhoneIcon, ShieldCheck,
  TrendingUp, DatabaseZap, MapPin, Calendar, History,
  ArrowUpRight, Network, Signal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBilling } from "@/context/BillingContext";
import { getInvoiceServiceDates } from "@/components/invoice/invoicePreviewUtils";
import { toast } from "sonner";
import { getBrandSettings } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useBusinessMode } from "@/lib/turso";
import { Logo } from "@/components/Logo";
import PaymentReceiptModal from "@/components/payment/PaymentReceiptModal";
import * as XLSX from 'xlsx';
import { useSearchParams } from "react-router-dom";

export default function Payments() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const customerIdLabel = isCableMode ? "STB" : "CID";
  const { 
    payments, subscribers, plans, invoices, recordPayment, deletePayment, isLoading, 
    companySettings, refreshData, filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate 
  } = useBilling();
  const brand = getBrandSettings(companySettings);
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    subscriberId: "",
    amount: 0,
    discount: 0,
    method: "Cash" as const,
  });
  const [bulkSubscribers, setBulkSubscribers] = useState<any[]>([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkMethod, setBulkMethod] = useState<"Cash" | "UPI">("Cash");

  const getSubscriberDueBreakdown = (subscriberId: string) => {
    const sub = (subscribers || []).find((item) => item.id === subscriberId);
    if (!sub) return { previousDue: 0, currentDue: 0, total: 0 };

    const invs = (invoices || []).filter((inv) => inv.subscriberId === subscriberId);
    const previousDue = invs.filter(inv => inv.type === 'legacy').reduce((s, inv) => s + Number(inv.amount || 0), 0);
    const currentDue = invs.filter(inv => inv.type !== 'legacy').reduce((s, inv) => s + Number(inv.amount || 0), 0);
    
    const totalPaid = (payments || [])
      .filter((payment) => payment.subscriberId === subscriberId)
      .reduce((sum, payment) => sum + Number(payment.amount || 0) + (Number(payment.discount) || 0), 0);
    
    const opening = Number(sub.openingBalance || 0);
    const totalInvoiced = previousDue + currentDue;
    
    // Simple allocation logic
    let remainingCredit = totalPaid;
    let remOpening = opening;
    let remPrev = previousDue;
    let remCurr = currentDue;

    const useCredit = (amt: number) => {
      const take = Math.min(amt, remainingCredit);
      remainingCredit -= take;
      return amt - take;
    };

    remOpening = useCredit(remOpening);
    remPrev = useCredit(remPrev);
    remCurr = useCredit(remCurr);

    return {
      previousDue: remOpening + remPrev,
      currentDue: remCurr,
      total: remOpening + remPrev + remCurr
    };
  };

  const getSubscriberDueAmount = (subscriberId: string) => getSubscriberDueBreakdown(subscriberId).total;

  const closeAddModal = () => {
    setIsAddOpen(false);
    setFormData({ subscriberId: "", amount: 0, discount: 0, method: "Cash" });
    if (searchParams.get("subscriberId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("subscriberId");
      setSearchParams(nextParams, { replace: true });
    }
  };

  useEffect(() => {
    const sIds = searchParams.get("subscriberIds");
    if (sIds) {
      const ids = sIds.split(',').filter(Boolean);
      const subs = subscribers.filter(s => ids.includes(s.id));
      if (subs.length > 0) {
        setBulkSubscribers(subs.map(s => ({
          id: s.id,
          name: s.name,
          customerNo: s.customerNo,
          due: getSubscriberDueAmount(s.id),
          amount: getSubscriberDueAmount(s.id),
          discount: 0
        })));
        setIsBulkOpen(true);
      }
      return;
    }

    const subscriberId = searchParams.get("subscriberId");
    if (!subscriberId) return;

    const subscriber = subscribers.find((item) => item.id === subscriberId);
    if (!subscriber) return;

    setFormData({
      subscriberId,
      amount: getSubscriberDueAmount(subscriberId),
      discount: 0,
      method: "Cash",
    });
    setIsAddOpen(true);
  }, [searchParams, subscribers, invoices, payments]);

  const handleBulkSubmit = async () => {
    setIsSubmitting(true);
    try {
      let count = 0;
      let lastRecordedPayment = null;
      for (const sub of bulkSubscribers) {
        if (sub.amount > 0) {
          const res = await recordPayment({
            subscriberId: sub.id,
            amount: sub.amount - sub.discount,
            discount: sub.discount,
            method: bulkMethod,
            date: new Date().toISOString(),
            agent: "System Admin"
          });
          lastRecordedPayment = res;
          count++;
        }
      }
      if (count > 0) {
        toast.success(`Recorded ${count} batch payments`);
      }
      setIsBulkOpen(false);
      setBulkSubscribers([]);
      if (searchParams.get("subscriberIds")) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("subscriberIds");
        setSearchParams(nextParams, { replace: true });
      }
    } catch (err) {
      toast.error("Batch processing failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      setScale(newScale);
    };
    if (isReceiptOpen) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isReceiptOpen]);

  const loadHtml2Pdf = async () => (await import("html2pdf.js")).default;

  const getPaymentItems = (payment: any) => {
    if (!payment) return [];
    const sub = subscribers.find(s => s.id === payment.subscriberId);
    const plan = plans.find(p => p.id === sub?.planId);
    
    // Clean plan name for Cable mode
    // Clean plan name for Cable mode aggressively
    let planName = plan?.name || 'Service';
    if (isCableMode && planName) {
      planName = planName
        .replace(/\[[^\]]*mbps[^\]]*\]/gi, "")
        .replace(/\([^\)]*mbps[^\)]*\)/gi, "")
        .replace(/\d+\s*mbps/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\[\s*\]/g, "")
        .replace(/\(\s*\)/g, "")
        .trim();
    }

    const chronoInvoices = invoices.filter(inv => inv.subscriberId === payment.subscriberId)
      .sort((a, b) => {
        const typeA = a.type === 'legacy' ? 0 : 1;
        const typeB = b.type === 'legacy' ? 0 : 1;
        if (typeA !== typeB) return typeA - typeB;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    const subPayments = payments.filter(p => p.subscriberId === payment.subscriberId);
    const prevTotalPaid = subPayments
      .filter(p => new Date(p.date).getTime() < new Date(payment.date).getTime() || 
                  (new Date(p.date).getTime() === new Date(payment.date).getTime() && p.id < payment.id))
      .reduce((s, p) => s + Number(p.amount) + (Number(p.discount) || 0), 0);

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

    const priorityInvoices = [...chronoInvoices].sort((a, b) => {
      if (payment.invoiceId === a.id) return -1;
      if (payment.invoiceId === b.id) return 1;
      return 0;
    });

    const items: any[] = [];
    let remainingCurrentPayment = Number(payment.amount) + (Number(payment.discount) || 0);

    if (remainingOpeningDue > 0 && remainingCurrentPayment > 0) {
      const amt = Math.min(remainingOpeningDue, remainingCurrentPayment);
      items.push({ desc: "Previous Dues / Opening Balance", subDesc: "Outstanding balance", date: "\u2014", qty: "\u2014", total: amt });
      remainingCurrentPayment -= amt;
    }

    for (const inv of priorityInvoices) {
      const dues = invoiceRemainingDues.get(inv.id);
      if (!dues || dues.remaining <= 0 || remainingCurrentPayment <= 0) continue;
      const amt = Math.min(dues.remaining, remainingCurrentPayment);
      if (inv.type === 'legacy') {
        items.push({ desc: "Previous Year Billing", subDesc: "Historical dues", date: formatDate(inv.date), qty: "\u2014", total: amt });
      } else {
        const invDate = new Date(inv.date);
        invDate.setHours(12, 0, 0, 0);
        const sDates = getInvoiceServiceDates(inv, sub, plans);
        const dateRange = (sDates.rechargeDate && sDates.expiryDate) 
          ? `${formatDate(sDates.rechargeDate)} - ${formatDate(sDates.expiryDate)}`
          : (inv.billingPeriod || invDate.toLocaleString('default', { month: 'short', year: '2-digit' }).toUpperCase());
          
        items.push({ 
          desc: `${isCableMode ? 'Cable TV' : 'Broadband'} Service (${dateRange})`, 
          subDesc: `${planName} Plan`, 
          date: formatDate(inv.date), 
          qty: "1", 
          total: amt 
        });
      }
      remainingCurrentPayment -= amt;
    }

    if (remainingCurrentPayment >= 0.1) {
      items.push({ desc: "Credit / Advance Received", subDesc: "Account balance", date: formatDate(payment.date), qty: "\u2014", total: remainingCurrentPayment });
    }
    return items;
  };

  const selectedPaymentItems = useMemo(() => getPaymentItems(selectedPayment), [selectedPayment, subscribers, plans, invoices, payments]);
  const getLinkedInvoice = (payment: any) => {
    if (!payment) return null;
    if (payment.invoiceId) return invoices.find(inv => inv.id === payment.invoiceId) || null;
    return invoices.filter(inv => inv.subscriberId === payment.subscriberId).sort((a,b) => Math.abs(new Date(a.date).getTime() - new Date(payment.date).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(payment.date).getTime()))[0] || null;
  };

  const selectedPaymentServiceDates = useMemo(() => {
    if (!selectedPayment) return { rechargeDate: "", expiryDate: "" };
    const sub = subscribers.find(s => s.id === selectedPayment.subscriberId);
    const linked = getLinkedInvoice(selectedPayment);
    return linked ? getInvoiceServiceDates(linked, sub, plans) : { rechargeDate: "", expiryDate: "" };
  }, [selectedPayment, subscribers, invoices, plans]);

  const [areaF, setAreaF] = useState<string>("all");
  const [methodF, setMethodF] = useState<string>("all");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2024, 2025, 2026, 2027, 2028, 2029];
  const areas = useMemo(() => Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort(), [subscribers]);

  const filtered = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return payments.filter(p => {
      const sub = subscribers.find(s => s.id === p.subscriberId);
      const matchQ = tokens.length === 0 || tokens.every(t => 
        (sub?.name || "").toLowerCase().includes(t) || 
        (sub?.area || "").toLowerCase().includes(t) || 
        (sub?.id || "").toLowerCase().includes(t) || 
        (p.id || "").toLowerCase().includes(t)
      );
      const payDate = new Date(p.date);
      const matchMonth = payDate >= filterStartDate && payDate <= filterEndDate;
      const matchArea = areaF === "all" || sub?.area === areaF;
      const matchMethod = methodF === "all" || p.method === methodF;
      return matchQ && matchMonth && matchArea && matchMethod;
    });
  }, [q, payments, subscribers, filterStartDate, filterEndDate, areaF, methodF]);

  const sorted = [...filtered].sort((a,b) => +new Date(b.date) - +new Date(a.date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriberId || (Number(formData.amount || 0) + Number(formData.discount || 0)) <= 0) return toast.error("Invalid input protocol");
     try {
      setIsSubmitting(true);
      // The amount recorded in the DB is the actual cash collected
      const discount = Number(formData.discount || 0);
      const cashAmount = Number(formData.amount || 0) - discount;
      
      const newPay = await recordPayment({ 
        ...formData, 
        amount: cashAmount, 
        discount: discount,
        date: new Date().toISOString(), 
        agent: "System Admin" 
      });
      toast.success("Payment recorded successfully");
      closeAddModal();
    } catch (err) { toast.error("Transaction failed"); } finally { setIsSubmitting(false); }
  };

  const handleWhatsApp = (p: any) => {
    const sub = subscribers.find(s => s.id === p.subscriberId);
    if (!sub?.phone) return toast.error("Entity has no communication address");
    const cleanPhone = sub.phone.replace(/\D/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const items = getPaymentItems(p);
    const linked = getLinkedInvoice(p);
    const service = linked ? getInvoiceServiceDates(linked, sub, plans) : { expiryDate: "" };
    const msg = `*PAYMENT ACKNOWLEDGEMENT*\nEntity: ${sub.name}\nAmount: Rs. ${p.amount}\nMethod: ${p.method}\nTimestamp: ${formatDate(p.date)}\n${service.expiryDate ? `Cycle End: ${formatDate(service.expiryDate)}\n` : ""}Current Balance: Rs. ${sub.balance}\n\nProtocol Auth: ${brand.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadReceipt = async () => {
    const element = document.getElementById("receipt-content");
    if (!element) return;
    setIsSubmitting(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf().set({ margin: 0, filename: `Voucher_${selectedPayment.id.slice(-8)}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(element).save();
      toast.success("Voucher Exported");
    } catch (e) { toast.error("Export failed"); } finally { setIsSubmitting(false); }
  };

  const handleExportExcel = () => {
    try {
      const exportData = sorted.map(p => {
        const sub = subscribers.find(s => s.id === p.subscriberId);
        return {
          'Receipt ID': p.id,
          'Date': formatDate(p.date),
          'Subscriber': sub?.name || 'Unknown',
          [isCableMode ? 'STB No' : 'CID']: sub?.customerId || '',
          'Amount': p.amount,
          'Method': p.method,
          'Agent': p.agent || 'Direct'
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments");
      XLSX.writeFile(wb, `Payments_${activeBusinessMode}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Payments Exported to Excel");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("Failed to export Excel");
    }
  };

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + Number(p.amount), 0);
  const upiTotal = filtered.filter(p => p.method !== 'Cash').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenue collection and voucher registry.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cash / UPI inline totals */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex flex-col items-end px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600/70">Cash</span>
              <span className="text-sm font-bold text-amber-600 leading-none">₹{cashTotal.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-start px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[9px] uppercase font-bold tracking-widest text-blue-600/70">UPI</span>
              <span className="text-sm font-bold text-blue-600 leading-none">₹{upiTotal.toLocaleString()}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => { setIsGlobalRefreshing(true); refreshData().finally(() => setIsGlobalRefreshing(false)); }}
            disabled={isGlobalRefreshing}
            className="h-9 border-border text-muted-foreground hover:text-foreground"
          >
            <Activity className={cn("mr-2 h-4 w-4", isGlobalRefreshing && "animate-spin")} />
            Sync
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="h-9 border-border text-muted-foreground hover:text-foreground">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="h-9 bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="app-card p-3 flex flex-col lg:flex-row gap-3">
        {/* Search + Area + Method */}
        <div className="flex-1 flex flex-col sm:flex-row gap-3 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, name or area..."
              className="h-9 bg-input border-border pl-9 text-sm rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <select
              value={areaF}
              onChange={(e) => setAreaF(e.target.value)}
              className="h-9 bg-input border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-400 w-full sm:w-40 appearance-none"
            >
              <option value="all">All Areas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              value={methodF}
              onChange={(e) => setMethodF(e.target.value)}
              className="h-9 bg-input border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-400 w-full sm:w-36 appearance-none"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-2 py-1 flex-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground px-1">From</span>
            <select value={months[filterStartDate.getMonth()]} onChange={(e) => {
              const monthIndex = months.indexOf(e.target.value);
              const d = new Date(filterStartDate); 
              d.setMonth(monthIndex);
              if (d > filterEndDate) {
                setFilterStartDate(d);
                const end = new Date(d);
                end.setMonth(d.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                setFilterEndDate(end);
              } else {
                setFilterStartDate(d);
              }
            }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer flex-1">
              {months.map((m, idx) => (
                <option 
                  key={m} 
                  value={m} 
                  disabled={filterStartDate.getFullYear() === filterEndDate.getFullYear() && idx > filterEndDate.getMonth()}
                >
                  {m}
                </option>
              ))}
            </select>
            <select value={filterStartDate.getFullYear()} onChange={(e) => {
              const d = new Date(filterStartDate); 
              d.setFullYear(Number(e.target.value)); 
              if (d > filterEndDate) {
                setFilterStartDate(d);
                const end = new Date(d);
                end.setMonth(d.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                setFilterEndDate(end);
              } else {
                setFilterStartDate(d);
              }
            }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer w-14">
              {years.map(y => (
                <option key={y} value={y} disabled={y > filterEndDate.getFullYear()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-2 py-1 flex-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground px-1">To</span>
            <select value={months[filterEndDate.getMonth()]} onChange={(e) => {
              const monthIndex = months.indexOf(e.target.value);
              const d = new Date(filterEndDate); 
              d.setMonth(monthIndex + 1); 
              d.setDate(0); 
              d.setHours(23, 59, 59, 999); 
              if (d < filterStartDate) {
                setFilterEndDate(d);
                const start = new Date(d);
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                setFilterStartDate(start);
              } else {
                setFilterEndDate(d);
              }
            }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer flex-1">
              {months.map((m, idx) => (
                <option 
                  key={m} 
                  value={m} 
                  disabled={filterEndDate.getFullYear() === filterStartDate.getFullYear() && idx < filterStartDate.getMonth()}
                >
                  {m}
                </option>
              ))}
            </select>
            <select value={filterEndDate.getFullYear()} onChange={(e) => {
              const d = new Date(filterEndDate); 
              d.setFullYear(Number(e.target.value)); 
              if (d < filterStartDate) {
                setFilterEndDate(d);
                const start = new Date(d);
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                setFilterStartDate(start);
              } else {
                setFilterEndDate(d);
              }
            }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer w-14">
              {years.map(y => (
                <option key={y} value={y} disabled={y < filterStartDate.getFullYear()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Count + Total summary pill */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-foreground leading-none">{sorted.length}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Records</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-green-600 leading-none">₹{(cashTotal + upiTotal).toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Total</span>
          </div>
        </div>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
           <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : sorted.length === 0 ? (
           <div className="py-12 text-center text-muted-foreground app-card">
             No payments found.
           </div>
        ) : (
           sorted.map(p => {
              const sub = subscribers.find(s => s.id === p.subscriberId);
              const items = getPaymentItems(p);
              return (
                <div key={p.id} className="app-card p-4 space-y-3 relative">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="font-semibold text-foreground flex items-center gap-2">
                           {sub?.name || 'Unknown'}
                           <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono-num">#{sub?.customerNo}</span>
                         </div>
                         <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {sub?.area || "N/A"}</div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <div className="font-bold text-foreground font-mono-num">₹{Number(p.amount).toLocaleString()}</div>
                         {(Number(p.discount || 0) > 0) && (
                           <div className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 rounded leading-tight">-{formatCurrency(Number(p.discount))} DISC</div>
                         )}
                      </div>
                         <div className={cn("text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded w-fit ml-auto", p.method === 'Cash' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>
                           {p.method}
                         </div>
                      </div>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                      <Calendar className="h-3 w-3" /> {formatDate(p.date)}
                      <span className="text-border">|</span>
                      <span className="font-mono-num">#{p.id.slice(-6).toUpperCase()}</span>
                   </div>
                   {items.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                        {items.slice(0, 2).map((it, idx) => (
                           <span key={idx} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{it.desc}</span>
                        ))}
                        {items.length > 2 && <span className="text-[10px] text-muted-foreground">+{items.length - 2} more</span>}
                     </div>
                   )}
                   <div className="flex gap-2 pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs bg-secondary hover:bg-secondary/80" onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }}><Eye className="h-3 w-3 mr-1" /> View</Button>
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100" onClick={() => handleWhatsApp(p)}><Share2 className="h-3 w-3 mr-1" /> Share</Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-red-50 text-red-500 hover:bg-red-100" onClick={() => setConfirmModal(p)}><Trash2 className="h-3 w-3" /></Button>
                   </div>
                </div>
              );
           })
        )}
      </div>

      {/* Desktop view - Table */}
      <div className="data-table hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th>Receipt Info</th>
                <th>Customer Details</th>
                <th>Items Covered</th>
                <th className="text-right">Amount</th>
                <th className="w-28"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></td></tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No payment records found</p>
                    </div>
                  </td>
                </tr>
              ) : sorted.map((p) => {
                const sub = subscribers.find(s => s.id === p.subscriberId);
                const items = getPaymentItems(p);
                return (
                  <tr key={p.id} className="group hover:bg-secondary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-foreground font-semibold font-mono-num">#{p.id.slice(-8).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(p.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{sub?.name || 'Unknown'}</span>
                          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono-num">#{sub?.customerNo}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {sub?.area || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {items.slice(0, 2).map((it, idx) => (
                          <span key={idx} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">{it.desc}</span>
                        ))}
                        {items.length > 2 && <span className="text-[10px] text-muted-foreground">+{items.length - 2} more</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-foreground font-bold font-mono-num">₹{Number(p.amount).toLocaleString()}</span>
                        {(Number(p.discount || 0) > 0) && (
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 rounded">-{formatCurrency(Number(p.discount))} DISC</span>
                        )}
                      </div>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold",
                          p.method === 'Cash' ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50")}>
                          {p.method}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1A3C6E] hover:text-[#1B2B4B] hover:bg-slate-100" onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }} title="Preview Receipt"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F47920] hover:text-[#D96611] hover:bg-orange-50" onClick={() => handleWhatsApp(p)} title="Share via WhatsApp"><Share2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmModal(p)} title="Delete Payment"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Payment Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Bulk Payment</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Recording payments for {bulkSubscribers.length} customers</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsBulkOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border mb-4">
                {['Cash', 'UPI'].map(m => (
                  <button 
                    key={m} 
                    type="button" 
                    onClick={() => setBulkMethod(m as any)} 
                    className={cn(
                      "flex-1 h-8 rounded-md text-sm font-medium transition-colors",
                      bulkMethod === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {bulkSubscribers.map((sub, idx) => (
                <div key={sub.id} className="p-3 bg-card border border-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{sub.name}</span>
                      <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-mono-num">#{sub.customerNo}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current Due</span>
                      <span className="text-sm font-bold text-red-500">₹{sub.due.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Amount (₹)</label>
                      <Input 
                        type="number" 
                        value={sub.amount || ""} 
                        onChange={(e) => {
                          const newSubs = [...bulkSubscribers];
                          newSubs[idx].amount = Number(e.target.value);
                          setBulkSubscribers(newSubs);
                        }}
                        className="h-8 bg-input border-border text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Discount (₹)</label>
                      <Input 
                        type="number" 
                        value={sub.discount || ""} 
                        onChange={(e) => {
                          const newSubs = [...bulkSubscribers];
                          newSubs[idx].discount = Number(e.target.value);
                          setBulkSubscribers(newSubs);
                        }}
                        className="h-8 bg-input border-border text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-border bg-secondary/30 flex-shrink-0">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider mb-1">Total Collection</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{bulkSubscribers.reduce((sum, s) => sum + (s.amount - s.discount), 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider mb-1">Total Discounts</span>
                  <span className="text-base font-bold text-foreground">
                    ₹{bulkSubscribers.reduce((sum, s) => sum + s.discount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 h-12 bg-secondary hover:bg-secondary/80 text-foreground font-semibold" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting} 
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                  Confirm All Payments
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Record Payment</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Add a new payment record</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeAddModal} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Customer</label>
                <select 
                  value={formData.subscriberId} 
                  onChange={(e) => setFormData({...formData, subscriberId: e.target.value})} 
                  className="w-full h-10 bg-input border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-400"
                >
                  <option value="">Select customer...</option>
                  {subscribers.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                    <option key={s.id} value={s.id}>#{s.customerNo} {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Total Bill Amount (₹)</label>
                    {formData.subscriberId && (
                      <div className="group relative">
                        <button type="button" className="text-blue-500 hover:text-blue-600 transition-colors">
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Due Breakdown</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Prev. Year Due:</span>
                              <span className="font-bold text-red-600">₹{getSubscriberDueBreakdown(formData.subscriberId).previousDue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Current Plan:</span>
                              <span className="font-bold text-orange-600">₹{getSubscriberDueBreakdown(formData.subscriberId).currentDue.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-slate-100 my-1" />
                            <div className="flex justify-between text-xs font-bold text-slate-900">
                              <span>Total Net Due:</span>
                              <span>₹{getSubscriberDueBreakdown(formData.subscriberId).total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Input 
                    type="number" 
                    value={formData.amount || ""} 
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                    className="h-10 bg-input border-border rounded-lg px-3 text-sm text-foreground focus-visible:border-orange-400" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Discount (₹)</label>
                  <Input 
                    type="number" 
                    value={formData.discount || ""} 
                    onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} 
                    className="h-10 bg-input border-border rounded-lg px-3 text-sm text-foreground focus-visible:border-orange-400" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              {/* Live Preview of Net Collection & Credit */}
              <div className="space-y-3">
                <div className="p-3 bg-secondary/50 rounded-xl border border-dashed border-border flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cash/UPI to Collect</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">₹</span>
                    <span className="text-lg font-bold text-orange-600">{(formData.amount - formData.discount).toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-2 bg-green-50/50 rounded-lg border border-green-100/50 flex justify-between items-center px-3">
                  <span className="text-[10px] font-bold text-green-700/70 uppercase tracking-tight">Total Credit to Customer</span>
                  <span className="text-sm font-bold text-green-700">₹{formData.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border">
                    {['Cash', 'UPI'].map(m => (
                      <button 
                        key={m} 
                        type="button" 
                        onClick={() => setFormData({...formData, method: m as any})} 
                        className={cn(
                          "flex-1 h-8 rounded-md text-sm font-medium transition-colors",
                          formData.method === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-border mt-4 flex-shrink-0">
                  <Button type="button" variant="ghost" className="flex-1 h-12 bg-secondary hover:bg-secondary/80 text-foreground font-semibold" onClick={closeAddModal}>Cancel</Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.subscriberId} 
                    className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                    Save Payment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {isReceiptOpen && selectedPayment && (
        <PaymentReceiptModal
          brand={brand}
          customerIdLabel={customerIdLabel}
          payment={selectedPayment}
          subscribers={subscribers}
          onClose={() => setIsReceiptOpen(false)}
          isCableMode={isCableMode}
          plans={plans}
          invoices={invoices}
          payments={payments}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm app-card p-6 text-center shadow-xl">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Payment</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this payment record? This action cannot be undone and will affect the customer's balance.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 bg-slate-100 hover:bg-slate-100 text-slate-800" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-red-500 hover:bg-red-600 text-slate-800" 
                onClick={() => { deletePayment(confirmModal.id); setConfirmModal(null); toast.success("Payment deleted"); }}
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
