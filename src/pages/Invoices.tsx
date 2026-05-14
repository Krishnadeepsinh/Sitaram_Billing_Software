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
  const customerIdLabel = isCableMode ? "STB" : "CID";
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
          (inv.number || "").toLowerCase().includes(token) ||
          (sub?.name || "").toLowerCase().includes(token) ||
          (sub?.customerNo?.toString() || "").toLowerCase().includes(token) ||
          (sub?.phone || "").includes(token) ||
          (sub?.area || "").toLowerCase().includes(token) ||
          (sub?.customerId || "").toLowerCase().includes(token) ||
          (planName).toLowerCase().includes(token)
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
      toast.success("Sync complete");
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
      toast.success("Entry generated");
      setShowSubSelect(false);
      setSelectedSub("");
      setDiscountAmount(0);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeBulk = async () => {
    setIsProcessing(true);
    try {
      const startDate = new Date(billingYear, billingMonth, 1);
      const numMonths = (endYear - billingYear) * 12 + (endMonth - billingMonth) + 1;
      if (numMonths <= 0) return;
      await runBulkBilling(startDate, numMonths, includePreviousDue);
      toast.success("Bulk process complete");
    } catch (e) {
      toast.error("Process failed");
    } finally {
      setIsProcessing(false);
      setConfirmModal(null);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("Deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const executeBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await bulkDeleteInvoices(selectedInvoices);
      toast.success("Selected purged");
      setSelectedInvoices([]);
    } catch (e) {
      toast.error("Purge failed");
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
      toast.success("Settled");
      setPayInv(null);
      setPayDiscount(0);
    } catch (e) {
      toast.error("Settlement failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 selection:text-white pb-10">
      <div className="max-w-[1600px] mx-auto px-4 pt-4">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-900/45 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/30">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-white">Invoices</h1>
              <p className="mt-1 text-xs text-slate-500">Create, track, and collect against subscriber invoices</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleSync}
              disabled={isProcessing}
              className="h-9 rounded-lg border-slate-700 bg-slate-950/80 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              <RefreshCcw className={`mr-2 h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowSubSelect(true)}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-500"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              New invoice
            </Button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
          <div className="lg:col-span-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 backdrop-blur-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search by name, invoice #, or area…" 
                className="h-9 w-full rounded-lg border-slate-800 bg-slate-950 pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500/40"
              />
            </div>
            <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
              {(["all", "paid", "pending", "overdue"] as const).map(f => (
                <button key={f} onClick={() => setStatusF(f)} className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${statusF === f ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 backdrop-blur-sm">
            <label className="mb-2 block text-xs font-medium text-slate-500">Invoice type</label>
            <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
              {(["all", "plan", "legacy"] as const).map(t => (
                <button key={t} onClick={() => setTypeF(t)} className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${typeF === t ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"}`}>{t}</button>
              ))}
            </div>
            <select value={areaF} onChange={(e) => setAreaF(e.target.value)} className="w-full h-7 mt-2 bg-slate-950 border border-slate-800 rounded px-2 text-[8px] font-black uppercase tracking-widest text-slate-400 outline-none">
              <option value="all">ALL REGIONS</option>
              {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="lg:col-span-5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">Temporal Scope</label>
              <Button variant="ghost" className="h-4 px-1 text-[6px] font-black uppercase text-blue-500 hover:bg-transparent" onClick={() => { setFilterMonth("all"); setFilterYear("all"); setFilterEndMonth("all"); setFilterEndYear("all"); }}>Reset Range</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-1">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex-1 h-7 bg-slate-950 border border-slate-800 rounded px-1 text-[8px] font-black uppercase tracking-widest text-white outline-none">
                  <option value="all">START</option>
                  {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                </select>
                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="w-16 h-7 bg-slate-950 border border-slate-800 rounded px-1 text-[8px] font-black uppercase text-white outline-none">
                  <option value="all">YYYY</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex gap-1">
                <select value={filterEndMonth} onChange={(e) => setFilterEndMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex-1 h-7 bg-slate-950 border border-slate-800 rounded px-1 text-[8px] font-black uppercase tracking-widest text-white outline-none">
                  <option value="all">END</option>
                  {months.map((m, i) => <option key={m} value={i}>{m.slice(0, 3)}</option>)}
                </select>
                <select value={filterEndYear} onChange={(e) => setFilterEndYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="w-16 h-7 bg-slate-950 border border-slate-800 rounded px-1 text-[8px] font-black uppercase text-white outline-none">
                  <option value="all">YYYY</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedInvoices.length > 0 && (
          <div className="mb-4 p-2 px-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-rose-500">{selectedInvoices.length} TARGETS MARKED FOR TERMINATION</span>
            <Button variant="destructive" size="sm" className="h-6 px-3 text-[7px] font-black uppercase tracking-widest" onClick={() => setConfirmModal({ type: 'bulkDelete' })}>Purge Selection</Button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-slate-900/40 rounded-xl border border-slate-800/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-slate-800">
                  <th className="p-3 w-10 text-center"><input type="checkbox" className="accent-blue-600 rounded" checked={sorted.length > 0 && selectedInvoices.length === sorted.length} onChange={(e) => setSelectedInvoices(e.target.checked ? sorted.map(i => i.id) : [])} /></th>
                  <th className="p-3 text-left">UID / Ref</th>
                  <th className="p-3 text-left">Entity Descriptor</th>
                  <th className="p-3 text-left">Settlement Status</th>
                  <th className="p-3 text-left">Execution Date</th>
                  <th className="p-3 text-right">Value (₹)</th>
                  <th className="p-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sorted.length > 0 ? sorted.map((inv) => {
                  const sub = subMap[inv.subscriberId];
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-3 text-center"><input type="checkbox" className="accent-blue-600 rounded" checked={selectedInvoices.includes(inv.id)} onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} /></td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white tracking-tighter tabular-nums group-hover:text-blue-500 transition-colors"><Highlight text={inv.number} query={q} /></span>
                          <span className="text-[6px] font-black uppercase tracking-widest text-slate-600 mt-0.5">Ref ID: {inv.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-white tracking-tight uppercase"><Highlight text={sub?.name || "Unknown"} query={q} /></span>
                            <span className="text-[6px] font-black text-blue-500 bg-blue-500/10 px-1 rounded border border-blue-500/20">#{sub?.customerNo}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[6px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1"><MapPin className="h-2 w-2" /> <Highlight text={sub?.area || "—"} query={q} /></span>
                            {inv.type === 'legacy' && <span className="text-[5px] font-black uppercase tracking-tighter px-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Legacy</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="scale-75 origin-left">
                          <StatusBadge status={inv.status} />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 tabular-nums">{formatDate(inv.date)}</span>
                          <span className="text-[6px] font-black uppercase tracking-widest text-slate-600 mt-0.5">Due: {formatDate(inv.dueDate)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-white tracking-tighter tabular-nums">{formatCurrency(inv.amount)}</span>
                          {inv.balance > 0 && <span className="text-[6px] font-black uppercase text-rose-500 mt-0.5">BAL: {formatCurrency(inv.balance)}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded bg-slate-950 border border-slate-800 text-slate-500 hover:text-white" onClick={() => { setPreviewInv(inv); setShowPreview(true); }}><Eye className="h-3 w-3" /></Button>
                          {inv.status !== 'paid' && <Button variant="ghost" size="icon" className="h-6 w-6 rounded bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white" onClick={() => { setPayInv(inv); setCustomAmount(inv.balance); }}><Wallet className="h-3 w-3" /></Button>}
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded bg-rose-600/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Activity className="h-12 w-12 text-slate-400" />
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">No Registry Matches Found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      {showSubSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-tighter text-white">Create <span className="text-blue-500">Record</span></h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSubSelect(false)} className="h-6 w-6 text-slate-500"><X className="h-4 w-4" /></Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Region</label>
                  <select value={selectedArea} onChange={(e) => { setSelectedArea(e.target.value); setSelectedSub(""); }} className="w-full h-8 bg-slate-950 border border-slate-800 rounded px-2 text-[9px] font-black uppercase text-white outline-none">
                    <option value="">SELECT...</option>
                    {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Entity</label>
                  <select value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)} disabled={!selectedArea} className="w-full h-8 bg-slate-950 border border-slate-800 rounded px-2 text-[9px] font-black uppercase text-white outline-none disabled:opacity-30">
                    <option value="">SELECT...</option>
                    {subscribers.filter(s => s.area === selectedArea).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>#{s.customerNo} {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Schema</label>
                  <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                    {(["plan", "legacy"] as const).map(t => (
                      <button key={t} onClick={() => setBillingType(t)} className={`flex-1 h-6 rounded text-[7px] font-black uppercase tracking-widest transition-all ${billingType === t ? "bg-blue-600 text-white" : "text-slate-500"}`}>{t}</button>
                    ))}
                  </div>
                </div>
                {billingType === "plan" ? (
                  <div className="space-y-1">
                    <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Cycle</label>
                    <select value={planMonths} onChange={(e) => setPlanMonths(Number(e.target.value))} className="w-full h-6 bg-slate-950 border border-slate-800 rounded px-2 text-[8px] font-black uppercase text-white">
                      {[1,2,3,6,12].map(m => <option key={m} value={m}>{m} MONTHS</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Adjustment (₹)</label>
                    <input type="number" value={discountAmount || ''} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="w-full h-6 bg-slate-950 border border-slate-800 rounded px-2 text-[9px] font-black text-white outline-none" placeholder="0.00" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Effective Date</label>
                <input type="date" value={rechargeDate} onChange={(e) => setRechargeDate(e.target.value)} className="w-full h-8 bg-slate-950 border border-slate-800 rounded px-2 text-[9px] font-black text-white outline-none" />
              </div>

              <Button onClick={handleGenerateSingle} disabled={isProcessing || !selectedSub} className="w-full h-9 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded shadow-lg shadow-blue-600/10">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Registry Object"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-tighter text-white">Record <span className="text-blue-500">Settlement</span></h2>
              <Button variant="ghost" size="icon" onClick={() => setPayInv(null)} className="h-6 w-6 text-slate-500"><X className="h-4 w-4" /></Button>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 mb-4 flex justify-between items-center">
              <div>
                <p className="text-[6px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Entity</p>
                <p className="text-[10px] font-black text-white">{subMap[payInv.subscriberId]?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[6px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Outstanding</p>
                <p className="text-xs font-black text-blue-500 tabular-nums">{formatCurrency(payInv.balance)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Method</label>
                  <div className="flex gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                    {(["Cash", "UPI"] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)} className={`flex-1 h-6 rounded text-[7px] font-black uppercase tracking-widest transition-all ${payMethod === m ? "bg-blue-600 text-white" : "text-slate-500"}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Timestamp</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full h-7 bg-slate-950 border border-slate-800 rounded px-2 text-[9px] font-black text-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-slate-500 ml-1">Rebate (₹)</label>
                  <input type="number" value={payDiscount || ''} onChange={(e) => setPayDiscount(Number(e.target.value))} className="w-full h-8 bg-slate-950 border border-slate-800 rounded px-2 text-base font-black text-white outline-none text-center" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black uppercase text-blue-500 ml-1">Settlement (₹)</label>
                  <input type="number" value={customAmount || ''} onChange={(e) => setCustomAmount(Number(e.target.value))} className="w-full h-8 bg-slate-900 border border-blue-500/30 rounded px-2 text-base font-black text-blue-500 outline-none text-center" />
                </div>
              </div>

              <Button onClick={handlePay} disabled={isProcessing} className="w-full h-10 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded shadow-lg shadow-blue-600/20">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authenticate Transaction"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in zoom-in-95 duration-150">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-2xl">
            <div className={`h-12 w-12 mx-auto rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-4`}>
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">Security <span className="text-rose-500">Override</span></h2>
            <p className="text-[7px] text-slate-500 uppercase tracking-widest font-bold mb-6">Irreversible Operation. Confirm Auth.</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 h-8 text-[7px] font-black uppercase tracking-widest text-slate-500 hover:text-white" onClick={() => setConfirmModal(null)}>Abort</Button>
              <Button variant="destructive" className="flex-1 h-8 text-[7px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500" onClick={() => {
                if (confirmModal.type === 'bulk') executeBulk();
                else if (confirmModal.type === 'bulkDelete') executeBulkDelete();
                else if (confirmModal.id) executeDelete(confirmModal.id);
                setConfirmModal(null);
              }}>Execute</Button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewInv && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>}>
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
