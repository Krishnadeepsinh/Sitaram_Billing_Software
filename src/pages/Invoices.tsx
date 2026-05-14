import { lazy, Suspense, useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus, Search, Loader2, BarChart3, X, Trash2, Send, Wifi, Wallet, Check, MapPin, Phone, Eye, RefreshCcw, AlertCircle, History, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBusinessMode } from "@/lib/turso";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getBrandSettings } from "@/lib/branding";

const InvoicePreviewModal = lazy(() => import("@/components/invoice/InvoicePreviewModal"));

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query || !text) return <>{text || ""}</>;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <>{text}</>;
  
  const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const parts = String(text).split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 px-0.5 rounded-sm font-bold">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function Invoices() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const customerIdLabel = isCableMode ? "STB Number" : "Customer ID";
  const { invoices, subscribers, payments, plans: plansList, generateInvoice, runBulkBilling, runAutoLegacyBilling, deleteInvoice, bulkDeleteInvoices, recordPayment, companySettings, recalculateBalances } = useBilling();
  const brand = getBrandSettings(companySettings);
  
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 180);
  const [statusF, setStatusF] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [typeF, setTypeF] = useState<"all" | "plan" | "legacy">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSubSelect, setShowSubSelect] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewInv, setPreviewInv] = useState<any>(null);
  const [payInv, setPayInv] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI">("Cash");
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: 'bulk' | 'delete' | 'bulkDelete', id?: string } | null>(null);
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth());
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [rechargeDate, setRechargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [planMonths, setPlanMonths] = useState(1);
  const [endMonth, setEndMonth] = useState(new Date().getMonth());
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [includePreviousDue, setIncludePreviousDue] = useState(false);
  const [billingType, setBillingType] = useState<"plan" | "legacy">("plan");
  const [filterMonth, setFilterMonth] = useState<number | "all">(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | "all">(new Date().getFullYear());
  const [filterEndMonth, setFilterEndMonth] = useState<number | "all">(new Date().getMonth());
  const [filterEndYear, setFilterEndYear] = useState<number | "all">(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<"date" | "customerNo">("customerNo");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [payDiscount, setPayDiscount] = useState(0);
  const [areaF, setAreaF] = useState<string>("all");

  const autoBillingRun = useRef(false);
  
  // Auto-generate legacy invoices in January
  useEffect(() => {
    if (filterMonth === 0 && !autoBillingRun.current) {
      autoBillingRun.current = true;
      runAutoLegacyBilling().finally(() => {
        // We keep it true for the duration of the session/view to prevent re-triggering
        // unless they leave the page or change month back and forth
      });
    } else if (filterMonth !== 0) {
      autoBillingRun.current = false;
    }
  }, [filterMonth, runAutoLegacyBilling]);

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
  const selectedPlanForManualInvoice = plansList.find(p => p.id === subscribers.find(s => s.id === selectedSub)?.planId);
  const isValidRechargeDate = /^\d{4}-\d{2}-\d{2}$/.test(rechargeDate) && !Number.isNaN(new Date(`${rechargeDate}T12:00:00`).getTime());
  const projectedExpiryDate = useMemo(() => {
    if (billingType !== "plan" || !isValidRechargeDate || !selectedPlanForManualInvoice) return "";
    const start = new Date(`${rechargeDate}T12:00:00`);
    start.setDate(start.getDate() + Math.max(1, Number(selectedPlanForManualInvoice.validityDays || 30) * planMonths) - 1);
    return start.toISOString();
  }, [billingType, isValidRechargeDate, rechargeDate, selectedPlanForManualInvoice, planMonths]);

  const filtered = useMemo(() => {
    const allInvoices = invoices;
    const tokens = debouncedQ.toLowerCase().split(/\s+/).filter(Boolean);

    return allInvoices.filter((inv) => {
      const sub = subscribers.find(s => s.id === inv.subscriberId);
      const planName = plansList.find(p => p.id === sub?.planId)?.name || "";
      
      const matchQ = tokens.length === 0 || tokens.every(token => {
        return (
          (inv.number || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (sub?.name || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (sub?.customerNo?.toString() || "").toLowerCase().includes(token) ||
          (sub?.phone || "").includes(token) ||
          (sub?.area || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (sub?.customerId || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (planName).toLowerCase().replace(/\s+/g, ' ').includes(token)
        );
      });
      
      const matchStatus = statusF === "all" || inv.status === statusF;
      const matchType = typeF === "all" || (inv.type || 'plan') === typeF;
      const matchArea = areaF === "all" || sub?.area === areaF;
      
      const invDate = new Date(inv.date);
      const invTime = invDate.getFullYear() * 12 + invDate.getMonth();
      
      const startMonth = filterMonth === "all" ? 0 : Number(filterMonth);
      const startYear = filterYear === "all" ? 0 : Number(filterYear);
      const startTime = filterYear === "all" ? -1 : startYear * 12 + startMonth;
      
      const endMonthVal = filterEndMonth === "all" ? 11 : Number(filterEndMonth);
      const endYearVal = filterEndYear === "all" ? 9999 : Number(filterEndYear);
      const endTime = filterEndYear === "all" ? 999999 : endYearVal * 12 + endMonthVal;

      // Logic: Show if in range OR if it's an unpaid legacy/overdue invoice from the past
      const inRange = filterMonth === "all" || (invTime >= startTime && invTime <= endTime);
      const isPastUnpaid = inv.status !== "paid" && invTime < startTime;
      
      const matchPeriod = inRange || isPastUnpaid;

      return matchQ && matchStatus && matchType && matchPeriod && matchArea;
    });
  }, [debouncedQ, statusF, typeF, areaF, filterMonth, filterYear, filterEndMonth, filterEndYear, invoices, subscribers, plansList]);

  const stats = useMemo(() => {
    // Current period range
    const startMonth = filterMonth === "all" ? 0 : filterMonth;
    const startYear = filterYear === "all" ? 0 : filterYear;
    const startTime = filterYear === "all" ? -1 : startYear * 12 + startMonth;
    
    const endMonthVal = filterEndMonth === "all" ? 11 : filterEndMonth;
    const endYearVal = filterEndYear === "all" ? 9999 : filterEndYear;
    const endTime = filterEndYear === "all" ? 999999 : endYearVal * 12 + endMonthVal;

    // Total Invoiced in Period
    const total = invoices.filter(inv => {
      const sub = subscribers.find(s => s.id === inv.subscriberId);
      const matchArea = areaF === "all" || sub?.area === areaF;
      const invDate = new Date(inv.date);
      const invTime = invDate.getFullYear() * 12 + invDate.getMonth();
      return (filterMonth === "all" || (invTime >= startTime && invTime <= endTime)) && matchArea;
    }).reduce((s, i) => s + Number(i.amount || 0), 0);

    // Pending Invoices in Period
    const invoicePending = invoices.filter(inv => {
      const sub = subscribers.find(s => s.id === inv.subscriberId);
      const matchArea = areaF === "all" || sub?.area === areaF;
      const invDate = new Date(inv.date);
      const invTime = invDate.getFullYear() * 12 + invDate.getMonth();
      const inPeriod = filterMonth === "all" || (invTime >= startTime && invTime <= endTime);
      return inPeriod && inv.status !== "paid" && matchArea;
    }).reduce((s, i) => s + Number(i.amount || 0), 0);
    
    // Outstanding Dues = Unpaid in period + All unpaid BEFORE period (Overdue) + Unbilled Opening Balances
    const unbilledLegacy = subscribers
      .filter(s => areaF === "all" || s.area === areaF)
      .reduce((s, sub) => s + (Number(sub.openingBalance) || 0), 0);
    
    const pending = invoices.filter(inv => {
      const sub = subscribers.find(s => s.id === inv.subscriberId);
      const matchArea = areaF === "all" || sub?.area === areaF;
      const invDate = new Date(inv.date);
      const invTime = invDate.getFullYear() * 12 + invDate.getMonth();
      const beforeOrInEnd = filterYear === "all" || invTime <= endTime;
      return beforeOrInEnd && inv.status !== "paid" && matchArea;
    }).reduce((s, i) => s + Number(i.amount || 0), 0) + unbilledLegacy;

    const totalDiscounts = invoices.filter(inv => {
      const sub = subscribers.find(s => s.id === inv.subscriberId);
      const matchArea = areaF === "all" || sub?.area === areaF;
      const invDate = new Date(inv.date);
      const invTime = invDate.getFullYear() * 12 + invDate.getMonth();
      return (filterMonth === "all" || (invTime >= startTime && invTime <= endTime)) && matchArea;
    }).reduce((s, i) => s + (Number(i.discount) || 0), 0);

    return { total, pending, invoicePending, totalDiscounts };
  }, [invoices, subscribers, areaF, filterMonth, filterYear, filterEndMonth, filterEndYear]);

  const { total, pending, invoicePending, totalDiscounts } = stats;
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "customerNo") {
      const subA = subscribers.find(s => s.id === a.subscriberId);
      const subB = subscribers.find(s => s.id === b.subscriberId);
      return (subA?.customerNo || 0) - (subB?.customerNo || 0);
    }
    return +new Date(b.date) - +new Date(a.date);
  });

  const handleGenerateSingle = async () => {
    if (!selectedSub) return;
    setIsProcessing(true);
    try {
      const isLegacy = billingType === "legacy";
      if (!isLegacy && !isValidRechargeDate) {
        toast.error("Please select a valid recharge date");
        return;
      }
      const targetDate = rechargeDate ? new Date(`${rechargeDate}T12:00:00`) : new Date();
      await generateInvoice(selectedSub, isLegacy ? 0 : planMonths, false, targetDate, isLegacy, undefined, discountAmount);
      toast.success(isLegacy ? "Legacy invoice generated" : "Recharge invoice generated" + (discountAmount > 0 ? " with discount" : ""));
      setShowSubSelect(false);
      setSelectedSub("");
      setSelectedArea("");
      setBillingType("plan");
      setDiscountAmount(0);
      setRechargeDate(new Date().toISOString().slice(0, 10));
      setPlanMonths(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulk = async () => {
    setConfirmModal({ type: 'bulk' });
  };

  const executeBulk = async () => {
    setIsProcessing(true);
    try {
      const startDate = new Date(billingYear, billingMonth, 1);
      const endDate = new Date(endYear, endMonth, 1);
      const numMonths = (endYear - billingYear) * 12 + (endMonth - billingMonth) + 1;
      
      if (numMonths <= 0) {
        toast.error("End date must be after or same as start date");
        return;
      }

      const results: any = await runBulkBilling(startDate, numMonths, includePreviousDue);
      
      const totalGen = (results?.generated || 0) + (results?.legacyGenerated || 0);
      const skipped = results?.skipped || 0;
      
      if (totalGen === 0 && skipped > 0) {
        toast.info(
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                <Check className="h-3 w-3 text-blue-600" />
              </div>
              <span className="font-bold text-sm">Up to Date</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">No new invoices were needed. All {skipped} subscribers are already billed for this period.</p>
          </div>
        );
      } else {
        toast.success(
          <div className="flex flex-col gap-3 p-1">
            <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
              <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Check className="h-4 w-4 stroke-[3px]" />
              </div>
              <span className="font-black text-sm uppercase tracking-tight">Bulk Billing Complete</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">Plan Invoices</span>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">+{results?.generated || 0}</span>
              </div>
              {includePreviousDue && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Legacy Invoices</span>
                  <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">+{results?.legacyGenerated || 0}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[11px] opacity-60">
                <span className="text-muted-foreground font-medium">Already Billed</span>
                <span className="font-bold text-slate-500 italic">{skipped} skipped</span>
              </div>
            </div>
          </div>,
          { duration: 5000 }
        );
      }
      setIncludePreviousDue(false);
    } catch (e) {
      toast.error("Bulk billing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({ type: 'delete', id });
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted");
      setSelectedInvoices(prev => prev.filter(invId => invId !== id));
    } catch (e) {
      toast.error("Failed to delete invoice");
    }
  };

  const executeBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await bulkDeleteInvoices(selectedInvoices);
      toast.success(`${selectedInvoices.length} invoice(s) deleted`);
      setSelectedInvoices([]);
    } catch (e: any) {
      console.error("Bulk delete error:", e);
      toast.error(e.message || "Bulk delete failed");
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleWhatsApp = (inv: any) => {
    const sub = subscribers.find(s => s.id === inv.subscriberId);
    if (!sub?.phone) {
      toast.error("Subscriber phone number not found");
      return;
    }
    
    const cleanPhone = sub.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const monthName = new Date(inv.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const message = `*INVOICE*
Hello ${sub.name},
Your invoice for *${monthName}* has been generated.

*Invoice No:* ${inv.number}
*Amount Due:* ₹${inv.amount}
*Status:* ${inv.status.toUpperCase()}
*Due Date:* ${formatDate(inv.dueDate)}

Please pay your dues at the earliest.
Thank you,
${brand.name}`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleOpenPreview = (inv: any) => {
    setPreviewInv(inv);
    setShowPreview(true);
  };

  const handlePay = async () => {
    if (!payInv) return;
    setIsProcessing(true);
    try {
      await recordPayment({
        subscriberId: payInv.subscriberId,
        invoiceId: payInv.id,
        amount: customAmount,
        discount: payDiscount,
        method: payMethod,
        date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        agent: "Chudasama Shaktisinh"
      });
      toast.success("Payment recorded successfully" + (payDiscount > 0 ? " with discount" : ""));
      setPayInv(null);
      setPayDiscount(0);
    } catch (e) {
      toast.error("Failed to record payment");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSync = async () => {
    setIsProcessing(true);
    try {
      // First ensure all legacy invoices are generated for anyone with debt
      await runAutoLegacyBilling();
      // Then reconcile all payments and update statuses
      await recalculateBalances();
      toast.success("All records reconciled and legacy dues generated.");
    } catch (e) {
      console.error("Sync error:", e);
      toast.error("Sync failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            Billing Records
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage digital invoices and tax compliance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline"
            className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-2 text-emerald-600 border-emerald-100 bg-emerald-50/30" 
            onClick={handleSync}
            disabled={isProcessing}
          >
            <RefreshCcw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
            Sync Records
          </Button>
          <Button 
            variant="outline"
            className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2" 
            onClick={handleBulk}
            disabled={isProcessing}
          >
            <Send className="h-4 w-4" />
            Bulk Cycle
          </Button>
          <Button 
            onClick={() => {
              setRechargeDate(new Date().toISOString().slice(0, 10));
              setPlanMonths(1);
              setShowSubSelect(true);
            }} 
            className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && previewInv && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-2xl">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-bold text-slate-700">Loading invoice preview...</span>
              </div>
            </div>
          }
        >
          <InvoicePreviewModal
            brand={brand}
            customerIdLabel={customerIdLabel}
            invoice={previewInv}
            invoices={invoices}
            isCableMode={isCableMode}
            onClose={() => setShowPreview(false)}
            payments={payments}
            plans={plansList}
            subscribers={subscribers}
          />
        </Suspense>
      )}

      {/* Manual Generation Modal */}
      {showSubSelect && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">Select Subscriber</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">Filter by Address (Optional)</label>
                <select 
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 outline-none"
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value);
                    setSelectedSub("");
                  }}
                >
                  <option value="">All Addresses</option>
                  {Array.from(new Set(subscribers.filter(s => s.status === 'active' && s.area).map(s => s.area))).sort().map(area => (
                    <option key={area || 'unknown'} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">Select Customer</label>
                <select 
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 outline-none"
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                >
                  <option value="">Choose a subscriber...</option>
                  {subscribers
                    .filter(s => s.status === 'active' && (!selectedArea || s.area === selectedArea))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.area ? `(${s.area})` : ''}</option>
                    ))}
                </select>
              </div>

              {billingType === "plan" && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Recharge Date</label>
                    <Input
                      type="date"
                      value={rechargeDate}
                      onChange={(e) => setRechargeDate(e.target.value)}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 font-bold text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">No. Of Months</label>
                    <select
                      value={planMonths}
                      onChange={(e) => setPlanMonths(Number(e.target.value))}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-4">
                {selectedSub && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => setBillingType("plan")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          billingType === "plan" 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-border bg-transparent text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        <Wifi className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Current Plan</span>
                      </button>
                      <button
                        type="button"
                        disabled={!(subscribers.find(s => s.id === selectedSub)?.openingBalance && Number(subscribers.find(s => s.id === selectedSub)!.openingBalance!) > 0)}
                        onClick={() => setBillingType("legacy")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                          billingType === "legacy" 
                            ? "border-amber-600 bg-amber-50 text-amber-900" 
                            : "border-border bg-transparent text-muted-foreground hover:border-slate-300"
                        }`}
                      >
                        <History className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Legacy Due</span>
                      </button>
                    </div>

                    {billingType === "plan" ? (
                      <div className="bg-secondary/20 border border-border/40 rounded-[1.5rem] p-5 space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>Selected Subscriber</span>
                          <span className="text-foreground">{subscribers.find(s => s.id === selectedSub)?.name}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>Plan</span>
                          <span className="text-foreground">{plansList.find(p => p.id === subscribers.find(s => s.id === selectedSub)?.planId)?.name.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>Service Period</span>
                          <span className="text-foreground">{formatDate(rechargeDate)} to {formatDate(new Date(new Date(rechargeDate).setMonth(new Date(rechargeDate).getMonth() + planMonths)).toISOString())}</span>
                        </div>
                        <div className="pt-3 border-t border-border/10 flex justify-between items-center">
                          <span className="text-sm font-black uppercase tracking-widest">Total Payable</span>
                          <span className="text-xl font-black text-primary">
                            {formatCurrency((plansList.find(p => p.id === subscribers.find(s => s.id === selectedSub)?.planId)?.price || 0) * planMonths)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                          <AlertCircle className="h-4 w-4" />
                          Legacy Due Billing
                        </div>
                        <p className="text-[10px] text-amber-700 leading-relaxed mb-3">
                          This will generate a separate invoice for the opening balance debt of this subscriber.
                        </p>
                            <span className="text-muted-foreground font-medium">Recharge Date</span>
                            <span className="font-mono-num font-bold">{isValidRechargeDate ? formatDate(`${rechargeDate}T12:00:00`) : "-"}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground font-medium">Plan Price</span>
                            <span className="font-mono-num font-bold">{formatCurrency(plansList.find(p => p.id === subscribers.find(s => s.id === selectedSub)?.planId)?.price || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground font-medium">Plan Duration</span>
                            <span className="font-mono-num font-bold">
                              {(selectedPlanForManualInvoice?.validityDays || 30) * planMonths} Days
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground font-medium">Months / Cycles</span>
                            <span className="font-mono-num font-bold">{planMonths}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground font-medium">Expiry Date</span>
                            <span className="font-mono-num font-bold">{formatDate(projectedExpiryDate || "")}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm mb-1 text-amber-600 font-bold">
                          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Legacy Due</span>
                          <span className="font-mono-num">{formatCurrency(subscribers.find(s => s.id === selectedSub)?.openingBalance || 0)}</span>
                        </div>
                      )}
                      <div className="pt-2 mt-2 border-t border-border/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <Plus className="h-3 w-3 text-rose-500" /> Custom Discount
                          </label>
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">₹</span>
                            <input 
                              type="number"
                              value={discountAmount}
                              onChange={(e) => setDiscountAmount(Number(e.target.value))}
                              className="w-full bg-background border border-border rounded-lg pl-5 pr-2 py-1 text-right font-mono-num text-xs font-bold focus:ring-1 focus:ring-rose-500 outline-none"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        {discountAmount > 0 && (
                          <p className="text-[9px] text-rose-500 font-bold text-right italic">
                            Discount of {formatCurrency(discountAmount)} applied
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between text-lg mt-2 pt-2 border-t border-border/50">
                        <span className="font-bold">Total Amount</span>
                        <span className="font-mono-num font-black text-primary">
                          {formatCurrency(
                            (billingType === "plan" 
                              ? (plansList.find(p => p.id === subscribers.find(s => s.id === selectedSub)?.planId)?.price || 0) * planMonths
                              : Number(subscribers.find(s => s.id === selectedSub)?.openingBalance || 0)) - discountAmount
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-12 rounded-xl font-bold"
                        onClick={() => {
                          setShowSubSelect(false);
                          setSelectedSub("");
                          setSelectedArea("");
                          setIncludePreviousDue(false);
                          setDiscountAmount(0);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
                        onClick={handleGenerateSingle}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Generate
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl font-bold"
                    onClick={() => {
                      setShowSubSelect(false);
                      setSelectedSub("");
                      setSelectedArea("");
                      setIncludePreviousDue(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {payInv && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Collect Payment</h2>
                <p className="text-xs text-muted-foreground">For Invoice {payInv.number}</p>
                {(() => {
                  const sub = subscribers.find(s => s.id === payInv.subscriberId);
                  const openingBal = Number(sub?.openingBalance || 0);
                  if (openingBal !== 0) {
                    return (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100">
                        <span className="text-[9px] font-black uppercase text-amber-700 tracking-tight">
                          Legacy {openingBal > 0 ? "Debt" : "Credit"}: {formatCurrency(Math.abs(openingBal))}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="p-4 bg-secondary/30 rounded-2xl border border-border/40">
                <div className="flex flex-col gap-3 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Amount</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-black">₹</span>
                    <Input 
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Number(e.target.value))}
                      className="pl-8 text-xl font-black text-foreground bg-background border-border/60 rounded-xl shadow-sm h-12" 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Invoice Amount: {formatCurrency(payInv.amount)}. You can accept partial or advance payments here.</p>
                </div>

                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-dashed border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                      <Plus className="h-3 w-3" /> Give Discount
                    </span>
                    {payDiscount > 0 && (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-lg border border-rose-200">
                        SAVING {formatCurrency(payDiscount)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-black">₹</span>
                    <Input 
                      type="number"
                      value={payDiscount || ''}
                      onChange={(e) => {
                        const newDisc = Number(e.target.value);
                        setPayDiscount(newDisc);
                        // If current amount is full amount, reduce it by discount
                        if (customAmount === payInv.amount || customAmount === payInv.amount - payDiscount) {
                          setCustomAmount(Math.max(0, payInv.amount - newDisc));
                        }
                      }}
                      placeholder="0.00"
                      className="pl-8 text-lg font-black text-rose-600 bg-rose-50/30 border-rose-100 rounded-xl focus:ring-rose-500/20 focus:border-rose-300 h-11" 
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground italic">Reducing bill payment by {formatCurrency(payDiscount || 0)}</p>
                </div>
                
                <div className="flex flex-col gap-3 mt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Date</span>
                  <Input 
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="text-foreground bg-background border-border/60 rounded-xl shadow-sm h-12" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPayMethod("Cash")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    payMethod === "Cash" 
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" 
                      : "border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  <Wallet className="h-6 w-6 mb-2" />
                  <span className="text-xs font-black uppercase">Cash</span>
                </button>
                <button
                  onClick={() => setPayMethod("UPI")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    payMethod === "UPI" 
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" 
                      : "border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  <Check className="h-6 w-6 mb-2" />
                  <span className="text-xs font-black uppercase">UPI</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setPayInv(null)}>
                Cancel
              </Button>
              <Button 
                disabled={isProcessing}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95" 
                onClick={handlePay}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Stats */}
      <div className="bg-slate-950 rounded-[2rem] p-6 sm:p-8 border border-white/5 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Search & Status</span>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder={`Search name, area, invoice #, ${customerIdLabel}...`} 
                className="pl-12 pr-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-600 font-medium" 
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
            
            <div className="flex flex-wrap gap-2 pt-2">
              {(["all", "paid", "pending", "overdue"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusF(f)}
                  className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-2 ${
                    statusF === f 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 active:scale-95" 
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 active:scale-95"
                  }`}
                >
                  {f}
                </button>
              ))}
              
              <div className="w-[1px] bg-white/10 mx-2 self-stretch" />

              {(["all", "plan", "legacy"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeF(t)}
                  className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-2 ${
                    typeF === t 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-95" 
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 active:scale-95"
                  }`}
                >
                  {t === "plan" ? "Plan" : t === "legacy" ? "Legacy" : "All Types"}
                </button>
              ))}

              <div className="w-[1px] bg-white/10 mx-2 self-stretch" />

              <div className="relative">
                <select
                  value={areaF}
                  onChange={(e) => setAreaF(e.target.value)}
                  className="px-5 py-2.5 h-[42px] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-2 bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[140px]"
                >
                  <option value="all" className="bg-slate-900">All Addresses</option>
                  {Array.from(new Set(subscribers.filter(s => s.area).map(s => s.area))).sort().map(area => (
                    <option key={area} value={area} className="bg-slate-900">{area}</option>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[450px] space-y-6 pt-8 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-10">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-amber-500 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Billing Period Filter</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">From Period</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={filterMonth} 
                      onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs"
                    >
                      <option value="all" className="bg-slate-900">All Months</option>
                      {months.map((m, i) => (
                        <option key={m} value={i} className="bg-slate-900">{m}</option>
                      ))}
                    </select>
                    <select 
                      value={filterYear} 
                      onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))}
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs"
                    >
                      <option value="all" className="bg-slate-900">All Years</option>
                      {years.map(y => (
                        <option key={y} value={y} className="bg-slate-900">{y}</option>
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
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs"
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
                      className="h-12 rounded-xl border border-white/10 bg-white/5 px-3 font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs"
                      disabled={filterYear === "all"}
                    >
                      <option value="all" className="bg-slate-900">All Years</option>
                      {years.map(y => (
                        <option key={y} value={y} className="bg-slate-900">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-1 pt-6 border-t border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sort Records:</span>
                <div className="flex bg-white/5 p-1 rounded-xl ring-1 ring-white/5">
                  <button 
                    onClick={() => setSortBy("customerNo")}
                    className={`text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all duration-300 ${
                      sortBy === "customerNo" 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Cust #
                  </button>
                  <button 
                    onClick={() => setSortBy("date")}
                    className={`text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all duration-300 ${
                      sortBy === "date" 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Inv Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-7 border border-white/10 shadow-2xl transition-all hover:scale-[1.02] duration-300 ring-1 ring-white/5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Total Invoiced</p>
          <p className="font-mono-num font-black text-3xl mt-3 tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{formatCurrency(total)}</p>
          <div className="h-1.5 w-10 bg-emerald-500 rounded-full mt-5 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
        </div>
        
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-7 border border-white/10 shadow-2xl transition-all hover:scale-[1.02] duration-300 ring-1 ring-white/5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Pending Invoices</p>
          <p className="font-mono-num font-black text-3xl mt-3 tracking-tighter text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]">{formatCurrency(invoicePending)}</p>
          <div className="h-1.5 w-10 bg-amber-500 rounded-full mt-5 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
        </div>

        <div className="bg-slate-950 rounded-[2rem] p-7 border-2 border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.2)] transition-all hover:scale-[1.05] duration-300 ring-4 ring-blue-500/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <CreditCard className="h-24 w-24 text-blue-500/50 rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-300 font-black">Outstanding Dues</p>
              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]" />
            </div>
            <p className="font-mono-num font-black text-4xl tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{formatCurrency(pending)}</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[10px] text-blue-200 font-black uppercase tracking-widest bg-blue-600/30 px-3 py-1.5 rounded-xl border border-blue-400/30 shadow-inner">
                Incl. Legacy Overdue
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-7 border border-white/10 shadow-2xl transition-all hover:scale-[1.02] duration-300 ring-1 ring-white/5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Discounts Given</p>
          <p className="font-mono-num font-black text-3xl mt-3 tracking-tighter text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.2)]">{formatCurrency(totalDiscounts)}</p>
          <div className="h-1.5 w-10 bg-rose-500 rounded-full mt-5 shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-card rounded-[1.5rem] overflow-hidden border-border/40 shadow-sm">
        {selectedInvoices.length > 0 && (
          <div className="bg-rose-50 border-b border-rose-100 p-4 flex justify-between items-center">
            <span className="text-sm font-bold text-rose-600">{selectedInvoices.length} invoice(s) selected</span>
            <Button 
              variant="destructive" 
              size="sm" 
              className="rounded-xl"
              onClick={() => setConfirmModal({ type: 'bulkDelete' })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black border-b border-border/60">
                <th className="px-6 py-5 w-12">
                  <input 
                    type="checkbox" 
                    className="rounded accent-primary"
                    checked={sorted.length > 0 && selectedInvoices.length === sorted.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(sorted.map(i => i.id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-5 font-black">#</th>
                <th className="px-6 py-5 font-black">Invoice #</th>
                <th className="px-6 py-5 font-black">Subscriber Details</th>
                <th className="px-6 py-5 font-black">Status</th>
                <th className="px-6 py-5 font-black">Due Date</th>
                <th className="px-6 py-5 text-right font-black">Amount</th>
                <th className="px-6 py-5 font-black"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sorted.length > 0 ? sorted.map((inv) => {
                const sub = subscribers.find(s => s.id === inv.subscriberId);
                return (
                  <tr key={inv.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        className="rounded accent-primary"
                        checked={selectedInvoices.includes(inv.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices(prev => [...prev, inv.id]);
                          } else {
                            setSelectedInvoices(prev => prev.filter(id => id !== inv.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-black text-xs text-muted-foreground">{sub?.customerNo || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-mono-num font-black text-sm text-foreground">
                          <Highlight text={inv.number} query={q} />
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-foreground">
                          <Highlight text={sub?.name || 'Unknown'} query={q} />
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                            <Highlight text={sub?.area || ""} query={q} />
                          </span>
                          {sub && (
                            inv.type === 'legacy' ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black uppercase border border-amber-200">
                                Previous Year Billing
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-black uppercase">
                                {plansList.find(p => p.id === sub.planId)?.name} @ {formatCurrency(plansList.find(p => p.id === sub.planId)?.price || 0)}/mo
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 relative group/status">
                        <StatusBadge status={inv.status} />
                        
                        {(() => {
                          const linkedPayments = payments.filter(p => p.invoiceId === inv.id);
                          if (linkedPayments.length > 0) {
                            return (
                              <>
                                <div className="flex items-center gap-1 cursor-help">
                                  <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="text-[9px] font-black uppercase text-emerald-600 tracking-tighter">
                                    {linkedPayments.length} {linkedPayments.length === 1 ? 'Payment' : 'Payments'}
                                  </span>
                                </div>

                                {/* Payment History Popup */}
                                <div className="absolute left-0 bottom-full mb-3 hidden group-hover/status:block z-[110] animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <div className="bg-slate-950/95 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/10 min-w-[280px]">
                                    <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                                      <div className="h-5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Timeline</p>
                                    </div>
                                    <div className="space-y-3 font-mono-num">
                                      {linkedPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((p, pIdx) => (
                                        <div key={p.id} className="flex flex-col gap-1 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-white">{formatCurrency(p.amount)}</span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{formatDate(p.date)}</span>
                                          </div>
                                          <div className="flex justify-between items-center opacity-70">
                                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{p.method}</span>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase">#{p.id.slice(0, 8)}</span>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      <div className="pt-3 mt-1 border-t border-white/10 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Total Received</span>
                                        <span className="text-xs font-black text-emerald-400">{formatCurrency(linkedPayments.reduce((s, p) => s + p.amount, 0))}</span>
                                      </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute -bottom-1.5 left-8 w-4 h-4 bg-slate-950/95 rotate-45 border-r border-b border-white/10" />
                                  </div>
                                </div>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-black text-muted-foreground font-mono-num">
                      {inv.status === 'paid' ? <span className="text-emerald-500 tracking-wider">PAID</span> : formatDate(inv.dueDate)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono-num font-black text-sm text-foreground">{formatCurrency(inv.amount)}</span>
                        {inv.discount && inv.discount > 0 ? (
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                            -{formatCurrency(inv.discount)} Disc.
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-emerald-100 text-emerald-600 transition-all" 
                          onClick={() => handleWhatsApp(inv)}
                          title="Share on WhatsApp"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" 
                          onClick={() => handleOpenPreview(inv)}
                          title="Preview Invoice"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        {inv.status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl hover:bg-emerald-100 text-emerald-600 transition-all" 
                            onClick={() => {
                              setPayInv(inv);
                              setCustomAmount(inv.amount);
                              setPayDiscount(0);
                              setPaymentDate(new Date().toISOString().slice(0, 10));
                            }}
                            title="Collect Payment"
                          >
                            <Wallet className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-rose-100 text-rose-500 transition-all" 
                          onClick={() => handleDelete(inv.id)}
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400"
                          onClick={() => handleOpenPreview(inv)}
                          title="Open Preview to Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-muted-foreground font-medium italic">
                    No invoices found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Action Footer */}
      <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative shadow-inner">
            <FileText className="h-8 w-8" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-white animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg tracking-tight text-foreground">Monthly Bulk Billing Cycle</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Automatically generate pending invoices for all <strong>{subscribers.filter(s => s.status === 'active').length} active</strong> subscribers in your network.</p>
          </div>
        </div>
        <Button 
          disabled={isProcessing}
          onClick={handleBulk}
          className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary h-14 px-8 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:-translate-y-1"
        >
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : null}
          Initiate Cycle
        </Button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white text-black w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2">Confirm Action</h2>
            <p className="text-slate-600 mb-6 font-medium">
              {confirmModal.type === 'bulk' 
                ? "Select the billing month and year for this cycle:"
                : confirmModal.type === 'bulkDelete'
                ? `Are you sure you want to delete ${selectedInvoices.length} selected invoice(s)? This action cannot be undone.`
                : "Are you sure you want to delete this invoice? This action cannot be undone."}
            </p>

            {confirmModal.type === 'bulk' && (
              <div className="space-y-6 mb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">From Period</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={billingMonth} 
                      onChange={(e) => setBillingMonth(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={billingYear} 
                      onChange={(e) => setBillingYear(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-amber-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">To Period</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={endMonth} 
                      onChange={(e) => setEndMonth(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                    <select 
                      value={endYear} 
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-sm"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-1">
                  <p className="text-[10px] text-primary uppercase font-black tracking-widest text-center">Billing Period</p>
                  <p className="text-sm font-bold text-slate-900 text-center">
                    {months[billingMonth]} {billingYear}
                    {((endYear - billingYear) * 12 + (endMonth - billingMonth) + 1) > 1 && (
                      <> — {months[endMonth]} {endYear}</>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold text-center">
                    Total duration: {((endYear - billingYear) * 12 + (endMonth - billingMonth) + 1)} Month(s)
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <Label htmlFor="bulk-include-previous" className="text-sm font-bold text-amber-900 flex items-center gap-2 cursor-pointer">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Include All Legacy Dues
                    </Label>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Clears previous outstanding balances for all subscribers in this cycle.
                    </p>
                  </div>
                  <Switch 
                    id="bulk-include-previous"
                    checked={includePreviousDue}
                    onCheckedChange={setIncludePreviousDue}
                    className="data-[state=checked]:bg-amber-600"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                variant={confirmModal.type === 'delete' || confirmModal.type === 'bulkDelete' ? 'destructive' : 'default'} 
                className={`rounded-xl ${confirmModal.type === 'bulk' ? 'bg-primary text-primary-foreground hover:opacity-90' : ''}`}
                onClick={() => {
                  if (confirmModal.type === 'bulk') {
                    executeBulk();
                  } else if (confirmModal.type === 'bulkDelete') {
                    executeBulkDelete();
                  } else if (confirmModal.id) {
                    executeDelete(confirmModal.id);
                  }
                  setConfirmModal(null);
                }}
              >
                {confirmModal.type === 'bulk' ? 'Generate All' : confirmModal.type === 'bulkDelete' ? 'Delete Selected' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



