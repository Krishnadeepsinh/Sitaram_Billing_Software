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
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-1 flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary" /> Ledger · Invoices
          </p>
          <h1 className="font-display text-3xl font-black tracking-tighter uppercase leading-none text-slate-900">
            Billing <span className="text-primary italic">Console</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="h-11 rounded-xl bg-white border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50"
            onClick={handleSync}
            disabled={isProcessing}
          >
            <RefreshCcw className={`h-3.5 w-3.5 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            className="h-11 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800"
            onClick={() => setShowSubSelect(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> New Entry
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 shadow-xl overflow-hidden">
        {subscribers.length === 0 && invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Business Data...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-slate-50/50 rounded-[2rem] p-6 lg:p-8 border border-slate-100">
              <div className="flex flex-col lg:flex-row gap-8 lg:items-start">
                <div className="flex-1 space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      value={q} 
                      onChange={(e) => setQ(e.target.value)} 
                      placeholder={`Search name, area, invoice #, ${customerIdLabel}...`} 
                      className="pl-12 pr-12 h-12 bg-white border-slate-200 text-slate-900 rounded-2xl focus:ring-primary/10 focus:border-primary/40 transition-all placeholder:text-slate-400 font-medium text-sm shadow-sm" 
                    />
                    {q && (
                      <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {(["all", "paid", "pending", "overdue"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setStatusF(f)}
                        className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border shadow-sm ${
                          statusF === f ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                    <div className="w-[1px] bg-slate-200 mx-3 self-stretch" />
                    {(["all", "plan", "legacy"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeF(t)}
                        className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border shadow-sm ${
                          typeF === t ? "bg-primary border-primary text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-[380px] space-y-4 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-1 bg-amber-500 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date Range</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">From</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-2 font-bold text-slate-900 text-[11px] uppercase">
                          <option value="all">All</option>
                          {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                        </select>
                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-2 font-bold text-slate-900 text-[11px]">
                          <option value="all">All</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">To</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={filterEndMonth} onChange={(e) => setFilterEndMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-2 font-bold text-slate-900 text-[11px] uppercase">
                          <option value="all">All</option>
                          {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                        </select>
                        <select value={filterEndYear} onChange={(e) => setFilterEndYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-10 rounded-xl border border-slate-200 bg-white px-2 font-bold text-slate-900 text-[11px]">
                          <option value="all">All</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="font-display text-base font-black tracking-tight uppercase text-slate-900">Registry <span className="text-primary italic">Live</span></h2>
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sorted.length} Entries</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSortBy(prev => prev === "date" ? "customerNo" : "date")} className="h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-200">
                    Sort: {sortBy === "date" ? "Date" : "Cust #"}
                  </Button>
                </div>

                {selectedInvoices.length > 0 && (
                  <div className="mb-8 p-5 rounded-[1.5rem] bg-rose-50 border border-rose-100 flex items-center justify-between animate-in slide-in-from-top-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-rose-600">{selectedInvoices.length} Invoices Selected</p>
                    <Button variant="destructive" size="sm" className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest px-6" onClick={() => setConfirmModal({ type: 'bulkDelete' })}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2.5">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                        <th className="px-5 py-2 w-10">
                          <input type="checkbox" className="rounded accent-primary h-4 w-4" checked={sorted.length > 0 && selectedInvoices.length === sorted.length} onChange={(e) => setSelectedInvoices(e.target.checked ? sorted.map(i => i.id) : [])} />
                        </th>
                        <th className="px-5 py-2">Identification</th>
                        <th className="px-5 py-2">Subscriber</th>
                        <th className="px-5 py-2 text-center">Status</th>
                        <th className="px-5 py-2">Deadline</th>
                        <th className="px-5 py-2 text-right">Net Total</th>
                        <th className="px-5 py-2 w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.length > 0 ? sorted.map((inv) => {
                        const sub = subMap[inv.subscriberId];
                        return (
                          <tr key={inv.id} className="group bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 rounded-2xl shadow-sm">
                            <td className="px-5 py-4 first:rounded-l-2xl border-y border-l border-slate-100 group-hover:bg-slate-50/30">
                              <input type="checkbox" className="rounded accent-primary h-4 w-4" checked={selectedInvoices.includes(inv.id)} onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} />
                            </td>
                            <td className="px-5 py-4 border-y border-slate-100 group-hover:bg-slate-50/30">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-mono-num font-black text-xs text-slate-900"><Highlight text={inv.number} query={q} /></span>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-wider">{formatDate(inv.date)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 border-y border-slate-100 group-hover:bg-slate-50/30">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-0.5 rounded-lg border border-primary/10 shadow-sm">#{sub?.customerNo || '—'}</span>
                                  <span className="text-sm font-black text-slate-900 tracking-tight"><Highlight text={sub?.name || 'Unknown User'} query={q} /></span>
                                </div>
                                <div className="flex items-center gap-2.5 mt-1.5">
                                  <span className="text-[9px] uppercase tracking-[0.1em] font-bold text-slate-400 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /><Highlight text={sub?.area || "Unspecified"} query={q} /></span>
                                  {inv.type === 'legacy' && <span className="text-[8px] px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-black uppercase border border-amber-100">Legacy Due</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 border-y border-slate-100 group-hover:bg-slate-50/30 text-center"><StatusBadge status={inv.status} /></td>
                            <td className="px-5 py-4 border-y border-slate-100 group-hover:bg-slate-50/30"><span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Calendar className="h-3 w-3 text-slate-300" />{formatDate(inv.dueDate)}</span></td>
                            <td className="px-5 py-4 text-right border-y border-slate-100 group-hover:bg-slate-50/30">
                              <p className="font-mono-num font-black text-sm text-slate-900">{formatCurrency(inv.amount)}</p>
                              {inv.balance > 0 && inv.status !== 'paid' && <p className="text-[9px] text-rose-500 font-black uppercase mt-1 tracking-tighter">Due: {formatCurrency(inv.balance)}</p>}
                            </td>
                            <td className="px-5 py-4 last:rounded-r-2xl border-y border-r border-slate-100 group-hover:bg-slate-50/30">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 rounded-xl" onClick={() => { setPreviewInv(inv); setShowPreview(true); }}><Eye className="h-4 w-4" /></Button>
                                {inv.status !== 'paid' && <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-emerald-50 text-emerald-600 rounded-xl" onClick={() => { setPayInv(inv); setCustomAmount(inv.balance); }}><Wallet className="h-4 w-4" /></Button>}
                                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-rose-50 text-rose-600 rounded-xl" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={7} className="px-6 py-32 text-center opacity-40"><FileText className="h-10 w-10 mx-auto mb-4 text-slate-300" /><p className="text-sm font-black uppercase tracking-widest text-slate-500">Registry Empty</p></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSubSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-slate-900">New <span className="text-primary italic">Invoice</span></h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSubSelect(false)} className="rounded-xl"><X className="h-5 w-5" /></Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Area</Label>
                <select value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setSelectedSub(""); }} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs">
                  <option value="">Select Area...</option>
                  {Array.from(new Set(subscribers.filter(s => s.area).map(s => s.area))).sort().map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subscriber</Label>
                <select value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)} disabled={!selectedArea} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs disabled:opacity-30">
                  <option value="">Select Account...</option>
                  {subscribers.filter(s => s.area === selectedArea).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>#{s.customerNo} - {s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Type</Label>
                  <div className="flex gap-2">
                    {(["plan", "legacy"] as const).map(t => (
                      <button key={t} onClick={() => setBillingType(t)} className={`flex-1 h-12 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${billingType === t ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {billingType === "plan" && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Duration</Label>
                    <select value={planMonths} onChange={(e) => setPlanMonths(Number(e.target.value))} className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none text-xs">
                      {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <Button onClick={handleGenerateSingle} disabled={isProcessing || !selectedSub} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg">
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {payInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-slate-900">Record <span className="text-emerald-500 italic">Payment</span></h2>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Inv #{payInv.number}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPayInv(null)} className="rounded-xl"><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Subscriber</p>
                <p className="font-black text-slate-900 text-sm">{subMap[payInv.subscriberId]?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Due</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(payInv.balance)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Method</Label>
                  <div className="flex gap-2">
                    {(["Cash", "UPI"] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)} className={`flex-1 h-12 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${payMethod === m ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white border-slate-200 text-slate-400"}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Discount (₹)</Label>
                  <Input type="number" value={payDiscount || ''} onChange={(e) => setPayDiscount(Number(e.target.value))} placeholder="0" className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 font-mono-num font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pay Amount (₹)</Label>
                  <Input type="number" value={customAmount || ''} onChange={(e) => setCustomAmount(Number(e.target.value))} className="h-12 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-900 font-mono-num font-black focus:ring-emerald-500/20" />
                </div>
              </div>
              <Button onClick={handlePay} disabled={isProcessing} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100">
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Record Payment Now"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
            <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center ${confirmModal.type === 'bulk' ? 'bg-primary/10 text-primary' : 'bg-rose-100 text-rose-600'}`}>
              {confirmModal.type === 'bulk' ? <Check className="h-8 w-8" /> : <Trash2 className="h-8 w-8" />}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Are you sure?</h2>
              <p className="text-sm text-slate-500 mt-2">This action will modify your records permanently. Please confirm to proceed.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button variant={confirmModal.type === 'bulk' ? 'default' : 'destructive'} className="flex-1 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => {
                if (confirmModal.type === 'bulk') executeBulk();
                else if (confirmModal.type === 'bulkDelete') executeBulkDelete();
                else if (confirmModal.id) executeDelete(confirmModal.id);
                setConfirmModal(null);
              }}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewInv && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}>
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
