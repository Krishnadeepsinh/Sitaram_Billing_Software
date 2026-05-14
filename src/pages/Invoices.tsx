import { lazy, Suspense, useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus, Search, Loader2, BarChart3, X, Trash2, Send, Wifi, Wallet, Check, MapPin, Phone, Eye, RefreshCcw, AlertCircle, History, CreditCard, Activity, Calendar } from "lucide-react";
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
  
  useEffect(() => {
    if (filterMonth === 0 && !autoBillingRun.current) {
      autoBillingRun.current = true;
      runAutoLegacyBilling().finally(() => {});
    } else if (filterMonth !== 0) {
      autoBillingRun.current = false;
    }
  }, [filterMonth, runAutoLegacyBilling]);

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
  const subMap = useMemo(() => {
    const map: Record<string, any> = {};
    subscribers.forEach(s => map[s.id] = s);
    return map;
  }, [subscribers]);

  const planMap = useMemo(() => {
    const map: Record<string, any> = {};
    plansList.forEach(p => map[p.id] = p);
    return map;
  }, [plansList]);

  const filtered = useMemo(() => {
    const allInvoices = invoices;
    const tokens = debouncedQ.toLowerCase().split(/\s+/).filter(Boolean);

    return allInvoices.filter((inv) => {
      const sub = subMap[inv.subscriberId];
      const planName = sub ? planMap[sub.planId]?.name || "" : "";
      
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

      const inRange = filterMonth === "all" || (invTime >= startTime && invTime <= endTime);
      const isPastUnpaid = inv.status !== "paid" && invTime < startTime;
      const matchPeriod = inRange || isPastUnpaid;

      return matchQ && matchStatus && matchType && matchPeriod && matchArea;
    });
  }, [debouncedQ, statusF, typeF, areaF, filterMonth, filterYear, filterEndMonth, filterEndYear, invoices, subMap, planMap]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "customerNo") {
        const subA = subMap[a.subscriberId];
        const subB = subMap[b.subscriberId];
        return (subA?.customerNo || 0) - (subB?.customerNo || 0);
      }
      return +new Date(b.date) - +new Date(a.date);
    });
  }, [filtered, sortBy, subMap]);

  const handleSync = async () => {
    setIsProcessing(true);
    try {
      await runAutoLegacyBilling();
      await recalculateBalances();
      toast.success("Records reconciled.");
    } catch (e) {
      toast.error("Sync failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSingle = async () => {
    if (!selectedSub) return;
    setIsProcessing(true);
    try {
      const isLegacy = billingType === "legacy";
      const targetDate = rechargeDate ? new Date(`${rechargeDate}T12:00:00`) : new Date();
      await generateInvoice(selectedSub, isLegacy ? 0 : planMonths, false, targetDate, isLegacy, undefined, discountAmount);
      toast.success(isLegacy ? "Legacy invoice generated" : "Recharge invoice generated");
      setShowSubSelect(false);
      setSelectedSub("");
      setDiscountAmount(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeBulk = async () => {
    setIsProcessing(true);
    try {
      const startDate = new Date(billingYear, billingMonth, 1);
      const numMonths = (endYear - billingYear) * 12 + (endMonth - billingMonth) + 1;
      if (numMonths <= 0) {
        toast.error("Invalid range");
        return;
      }
      await runBulkBilling(startDate, numMonths, includePreviousDue);
      toast.success("Bulk billing complete");
    } catch (e) {
      toast.error("Bulk billing failed");
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted");
    } catch (e) {
      toast.error("Failed to delete invoice");
    }
  };

  const executeBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await bulkDeleteInvoices(selectedInvoices);
      toast.success(`${selectedInvoices.length} invoices deleted`);
      setSelectedInvoices([]);
    } catch (e) {
      toast.error("Bulk delete failed");
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
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
        agent: "Admin"
      });
      toast.success("Payment recorded");
      setPayInv(null);
      setPayDiscount(0);
    } catch (e) {
      toast.error("Payment recording failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary/30 selection:text-white pb-20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="h-1 w-12 bg-slate-800 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Financial Ledger</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
              Billing <span className="text-primary italic">Console</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
              Manage accounts receivable and invoice generation. Reconcile system records with real-world transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleSync}
              disabled={isProcessing}
              className="h-14 px-6 rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-300 transition-all duration-300"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Reconcile
            </Button>
            <Button 
              className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setShowSubSelect(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] border border-slate-800 shadow-2xl shadow-black/40 overflow-hidden">
          {subscribers.length === 0 && invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="h-12 w-12 text-primary animate-spin opacity-50" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Establishing Data Connection...</p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Filter Area */}
              <div className="p-8 lg:p-12 bg-slate-900/30 border-b border-slate-800">
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="flex-1 space-y-8">
                    <div className="relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-600 group-focus-within:text-primary transition-colors" />
                      <Input 
                        value={q} 
                        onChange={(e) => setQ(e.target.value)} 
                        placeholder={`Search name, area, invoice #, ${customerIdLabel}...`} 
                        className="pl-14 pr-14 h-16 bg-slate-950 border-slate-800 text-white rounded-2xl focus:ring-primary/20 transition-all placeholder:text-slate-600 font-bold text-base shadow-inner border-2 focus:border-primary" 
                      />
                      {q && (
                        <button onClick={() => setQ("")} className="absolute right-5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-800 text-slate-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                        {(["all", "paid", "pending", "overdue"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setStatusF(f)}
                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${
                              statusF === f ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                        {(["all", "plan", "legacy"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTypeF(t)}
                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${
                              typeF === t ? "bg-primary text-white shadow-lg shadow-primary/10" : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-[420px] space-y-6 pt-10 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-12">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Temporal Filter</span>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Period From</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 font-bold text-white text-[10px] uppercase outline-none focus:border-primary transition-colors">
                            <option value="all">ALL</option>
                            {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                          </select>
                          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 font-bold text-white text-[10px] outline-none focus:border-primary transition-colors">
                            <option value="all">ALL</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Period To</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={filterEndMonth} onChange={(e) => setFilterEndMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 font-bold text-white text-[10px] uppercase outline-none focus:border-primary transition-colors">
                            <option value="all">ALL</option>
                            {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                          </select>
                          <select value={filterEndYear} onChange={(e) => setFilterEndYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-11 rounded-xl border border-slate-800 bg-slate-950 px-3 font-bold text-white text-[10px] outline-none focus:border-primary transition-colors">
                            <option value="all">ALL</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Area */}
              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-6">
                    <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white flex items-center gap-4">
                      <Activity className="h-6 w-6 text-primary" />
                      Registry Core
                    </h3>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-4 py-2 rounded-full border border-slate-800">{sorted.length} Indexed Objects</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSortBy(prev => prev === "date" ? "customerNo" : "date")} className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800 transition-all">
                    Sorting By: {sortBy === "date" ? "Chronological" : "Identifier"}
                  </Button>
                </div>

                {selectedInvoices.length > 0 && (
                  <div className="mb-10 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between animate-in slide-in-from-top-4 shadow-xl shadow-rose-500/5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">{selectedInvoices.length} Objects Selected for Mass Deletion</p>
                    <Button variant="destructive" className="h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-lg shadow-rose-500/20 transition-all" onClick={() => setConfirmModal({ type: 'bulkDelete' })}>
                      <Trash2 className="h-4 w-4 mr-2" /> Execute Purge
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-4">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">
                        <th className="px-6 py-4 w-12">
                          <input type="checkbox" className="rounded-lg accent-primary h-5 w-5 bg-slate-950 border-slate-800" checked={sorted.length > 0 && selectedInvoices.length === sorted.length} onChange={(e) => setSelectedInvoices(e.target.checked ? sorted.map(i => i.id) : [])} />
                        </th>
                        <th className="px-6 py-4">Identification</th>
                        <th className="px-6 py-4">Subscriber Entity</th>
                        <th className="px-6 py-4 text-center">Protocol Status</th>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4 text-right">Settlement</th>
                        <th className="px-6 py-4 w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.length > 0 ? sorted.map((inv) => {
                        const sub = subMap[inv.subscriberId];
                        return (
                          <tr key={inv.id} className="group hover:bg-slate-800/30 transition-all duration-300">
                            <td className="px-6 py-6 first:rounded-l-3xl border-y border-l border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50">
                              <input type="checkbox" className="rounded-lg accent-primary h-5 w-5 bg-slate-950 border-slate-800" checked={selectedInvoices.includes(inv.id)} onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} />
                            </td>
                            <td className="px-6 py-6 border-y border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50">
                              <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary transition-all shadow-inner">
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                  <span className="font-mono font-black text-sm text-white tracking-tight group-hover:text-primary transition-colors"><Highlight text={inv.number} query={q} /></span>
                                  <div className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-[0.1em]">{formatDate(inv.date)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 border-y border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20 shadow-inner">#{sub?.customerNo || '—'}</span>
                                  <span className="text-base font-black text-white tracking-tight leading-none group-hover:translate-x-1 transition-transform"><Highlight text={sub?.name || 'Unknown User'} query={q} /></span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 flex items-center gap-1.5"><MapPin className="h-3 w-3" /><Highlight text={sub?.area || "Unspecified"} query={q} /></span>
                                  {inv.type === 'legacy' && <span className="text-[9px] px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 font-black uppercase border border-amber-500/20">Legacy Ledger</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 border-y border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50 text-center">
                              <div className="flex justify-center scale-110">
                                <StatusBadge status={inv.status} />
                              </div>
                            </td>
                            <td className="px-6 py-6 border-y border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50">
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">
                                <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                {formatDate(inv.dueDate)}
                              </div>
                            </td>
                            <td className="px-6 py-6 text-right border-y border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50">
                              <p className="font-mono font-black text-lg text-white tracking-tighter">{formatCurrency(inv.amount)}</p>
                              {inv.balance > 0 && inv.status !== 'paid' && <p className="text-[10px] text-rose-500 font-black uppercase mt-1 tracking-widest animate-pulse">Pending: {formatCurrency(inv.balance)}</p>}
                            </td>
                            <td className="px-6 py-6 last:rounded-r-3xl border-y border-r border-slate-800 bg-slate-900/30 group-hover:bg-slate-800/50">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 origin-right">
                                <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-slate-950 rounded-2xl text-slate-500 hover:text-white border border-transparent hover:border-slate-800 transition-all" onClick={() => { setPreviewInv(inv); setShowPreview(true); }}><Eye className="h-5 w-5" /></Button>
                                {inv.status !== 'paid' && <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-emerald-500/10 text-emerald-500 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all" onClick={() => { setPayInv(inv); setCustomAmount(inv.balance); }}><Wallet className="h-5 w-5" /></Button>}
                                <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-rose-500/10 text-rose-500 rounded-2xl border border-transparent hover:border-rose-500/20 transition-all" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })}><Trash2 className="h-5 w-5" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-32 text-center">
                            <div className="flex flex-col items-center gap-6 opacity-20">
                              <FileText className="h-20 w-20 text-slate-400" />
                              <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 italic">No indexed records found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {showSubSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white">Create <span className="text-primary italic">Entry</span></h2>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Manual Billing Protocol</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSubSelect(false)} className="h-12 w-12 rounded-2xl hover:bg-slate-800 text-slate-500"><X className="h-6 w-6" /></Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Geographic Area</Label>
                  <select value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setSelectedSub(""); }} className="w-full h-14 rounded-2xl border-2 border-slate-800 bg-slate-950 px-5 font-bold text-white focus:outline-none focus:border-primary appearance-none text-sm transition-all shadow-inner">
                    <option value="" className="bg-slate-900">SELECT REGION...</option>
                    {Array.from(new Set(subscribers.filter(s => s.area).map(s => s.area))).sort().map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Account Holder</Label>
                  <select value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)} disabled={!selectedArea} className="w-full h-14 rounded-2xl border-2 border-slate-800 bg-slate-950 px-5 font-bold text-white focus:outline-none focus:border-primary appearance-none text-sm disabled:opacity-20 transition-all shadow-inner">
                    <option value="" className="bg-slate-900">SELECT IDENTITY...</option>
                    {subscribers.filter(s => s.area === selectedArea).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id} className="bg-slate-900">#{s.customerNo} - {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Billing Schema</Label>
                  <div className="flex gap-3 bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800 shadow-inner">
                    {(["plan", "legacy"] as const).map(t => (
                      <button key={t} onClick={() => setBillingType(t)} className={`flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${billingType === t ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {billingType === "plan" ? (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Duration Cycle</Label>
                    <select value={planMonths} onChange={(e) => setPlanMonths(Number(e.target.value))} className="w-full h-12 rounded-2xl border-2 border-slate-800 bg-slate-950 px-5 font-bold text-white focus:outline-none focus:border-primary appearance-none text-xs transition-all shadow-inner">
                      {[1,2,3,6,12].map(m => <option key={m} value={m} className="bg-slate-900">{m} MONTH CYCLE</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Custom Adjustment (₹)</Label>
                    <Input type="number" value={discountAmount || ''} onChange={(e) => setDiscountAmount(Number(e.target.value))} placeholder="0.00" className="h-12 rounded-2xl border-2 border-slate-800 bg-slate-950 text-white font-mono font-bold focus:border-primary transition-all shadow-inner" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Effective Execution Date</Label>
                <div className="relative">
                  <Input type="date" value={rechargeDate} onChange={(e) => setRechargeDate(e.target.value)} className="h-14 rounded-2xl border-2 border-slate-800 bg-slate-950 text-white font-bold pl-12 focus:border-primary transition-all shadow-inner" />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                </div>
              </div>

              <Button onClick={handleGenerateSingle} disabled={isProcessing || !selectedSub} className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Commit Billing Record"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {payInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500/20" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white">Settle <span className="text-emerald-500 italic">Balance</span></h2>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Transaction Ref: #{payInv.number}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPayInv(null)} className="h-12 w-12 rounded-2xl hover:bg-slate-800 text-slate-500"><X className="h-6 w-6" /></Button>
            </div>

            <div className="p-8 rounded-[2rem] bg-slate-950/50 border-2 border-slate-800 flex justify-between items-center shadow-inner group">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-2">Subject Entity</p>
                <div className="flex items-center gap-3">
                   <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <p className="font-black text-white text-xl tracking-tight">{subMap[payInv.subscriberId]?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-2">Debit Outstanding</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(payInv.balance)}</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Payment Method</Label>
                  <div className="flex gap-3 bg-slate-950 p-2 rounded-2xl border-2 border-slate-800 shadow-inner">
                    {(["Cash", "UPI"] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)} className={`flex-1 h-14 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${payMethod === m ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Execution Timestamp</Label>
                  <div className="relative">
                    <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="h-14 rounded-2xl border-2 border-slate-800 bg-slate-950 text-white font-bold pl-12 focus:border-emerald-500 transition-all shadow-inner" />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Discretionary Rebate (₹)</Label>
                  <Input type="number" value={payDiscount || ''} onChange={(e) => setPayDiscount(Number(e.target.value))} placeholder="0.00" className="h-16 rounded-2xl border-2 border-slate-800 bg-slate-950 text-white font-mono font-black text-xl focus:border-emerald-500 transition-all shadow-inner text-center" />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500/70 ml-1">Final Settlement (₹)</Label>
                  <Input type="number" value={customAmount || ''} onChange={(e) => setCustomAmount(Number(e.target.value))} className="h-16 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono font-black text-2xl focus:border-emerald-500 transition-all shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] text-center" />
                </div>
              </div>

              <Button onClick={handlePay} disabled={isProcessing} className="w-full h-20 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 group">
                {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                  <span className="flex items-center gap-4">
                    <Check className="h-7 w-7 group-hover:scale-125 transition-transform" />
                    Authenticate Transaction
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Protocol Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-12 shadow-[0_0_150px_rgba(0,0,0,0.8)] text-center space-y-8 relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-full h-2 ${confirmModal.type === 'bulk' ? 'bg-primary' : 'bg-rose-500'}`} />
            <div className={`h-24 w-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl border-2 ${confirmModal.type === 'bulk' ? 'bg-primary/10 text-primary border-primary/20 shadow-primary/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/10'}`}>
              {confirmModal.type === 'bulk' ? <Check className="h-12 w-12" /> : <Trash2 className="h-12 w-12" />}
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">Security <span className={confirmModal.type === 'bulk' ? 'text-primary italic' : 'text-rose-500 italic'}>Override</span></h2>
              <p className="text-sm text-slate-500 mt-4 font-medium leading-relaxed italic">This operation is irreversible and will modify core database records permanently. Confirm authorization to proceed.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-500 hover:text-white hover:bg-slate-800 transition-all" onClick={() => setConfirmModal(null)}>Abort</Button>
              <Button variant={confirmModal.type === 'bulk' ? 'default' : 'destructive'} className={`flex-1 h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${confirmModal.type === 'bulk' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`} onClick={() => {
                if (confirmModal.type === 'bulk') executeBulk();
                else if (confirmModal.type === 'bulkDelete') executeBulkDelete();
                else if (confirmModal.id) executeDelete(confirmModal.id);
                setConfirmModal(null);
              }}>Execute Protocol</Button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewInv && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
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
    </div>
  );
}
