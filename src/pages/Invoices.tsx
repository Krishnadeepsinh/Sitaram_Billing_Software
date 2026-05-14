import { lazy, Suspense, useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { 
  Download, FileText, Plus, Search, Loader2, BarChart3, X, 
  Trash2, Send, Wifi, Wallet, Check, MapPin, Phone, Eye, 
  RefreshCcw, AlertCircle, History, CreditCard, Activity, 
  Calendar, ShieldCheck, ArrowUpRight, Network, Signal, 
  TrendingUp, DatabaseZap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBusinessMode } from "@/lib/turso";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getBrandSettings } from "@/lib/branding";
import { cn } from "@/lib/utils";

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
          <mark key={i} className="bg-blue-500/20 text-blue-300 px-0.5 rounded-sm font-bold">{part}</mark>
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
      toast.success("Ledger Synchronized");
    } catch (e) {
      toast.error("Sync Failure");
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
      toast.success("Dispatch Authorized");
      setShowSubSelect(false);
      setSelectedSub("");
      setDiscountAmount(0);
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      toast.success("Registry Object Expunged");
    } catch (e) {
      toast.error("Deletion failed");
    }
  };

  const executeBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await bulkDeleteInvoices(selectedInvoices);
      toast.success("Batch Selection Purged");
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
      toast.success("Transaction Settled");
      setPayInv(null);
      setPayDiscount(0);
    } catch (e) {
      toast.error("Settlement failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 w-fit">
            <FileText className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80">Financial Ledger Terminal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
            Invoice <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Protocol</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Revenue Dispatch & Settlement Tracking</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isProcessing}
            className="h-12 rounded-xl border-white/5 bg-slate-900/40 px-6 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition-all backdrop-blur-xl"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", isProcessing && "animate-spin")} />
            Recalculate Hub
          </Button>
          <Button 
            onClick={() => setShowSubSelect(true)}
            className="h-12 rounded-xl bg-blue-600 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> Initialize Invoice
          </Button>
        </div>
      </div>

      {/* Industrial Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 app-panel p-4 border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-all" />
            <Input
              placeholder="SEARCH BY UID, REF, ENTITY OR REGION..."
              className="h-11 rounded-xl border-white/5 bg-slate-950/50 pl-11 text-[10px] font-bold tracking-widest text-white placeholder:text-slate-600 focus-visible:border-blue-500/40 focus-visible:ring-blue-500/10 transition-all uppercase"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-white/5 backdrop-blur-xl">
            {(["all", "paid", "pending", "overdue"] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setStatusF(f)} 
                className={cn(
                  "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                  statusF === f ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:text-slate-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 app-panel p-4 border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl space-y-4">
           <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-white/5 backdrop-blur-xl">
            {(["all", "plan", "legacy"] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setTypeF(t)} 
                className={cn(
                  "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                  typeF === t ? "bg-blue-800 text-white shadow-lg shadow-blue-800/20" : "text-slate-600 hover:text-slate-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <select 
            value={areaF} 
            onChange={(e) => setAreaF(e.target.value)} 
            className="w-full h-11 bg-slate-950 border border-white/5 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-blue-500/40 appearance-none shadow-inner"
          >
            <option value="all">ALL NETWORK SECTORS</option>
            {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a} className="bg-slate-900">{a.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="lg:col-span-4 app-panel p-4 border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Temporal Filter Scope</span>
            <button 
              onClick={() => { setFilterMonth("all"); setFilterYear("all"); setFilterEndMonth("all"); setFilterEndYear("all"); }}
              className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400"
            >
              Reset Cycle
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex gap-1.5 p-1 bg-slate-950 border border-white/5 rounded-xl">
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex-1 h-8 bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-white outline-none appearance-none px-2">
                <option value="all">START</option>
                {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m.slice(0, 3).toUpperCase()}</option>)}
              </select>
              <div className="w-px h-4 my-auto bg-white/5" />
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="w-16 h-8 bg-transparent border-none text-[9px] font-black uppercase text-white outline-none appearance-none px-2 text-center">
                <option value="all">YYYY</option>
                {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-950 border border-white/5 rounded-xl">
              <select value={filterEndMonth} onChange={(e) => setFilterEndMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex-1 h-8 bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-white outline-none appearance-none px-2">
                <option value="all">END</option>
                {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m.slice(0, 3).toUpperCase()}</option>)}
              </select>
              <div className="w-px h-4 my-auto bg-white/5" />
              <select value={filterEndYear} onChange={(e) => setFilterEndYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="w-16 h-8 bg-transparent border-none text-[9px] font-black uppercase text-white outline-none appearance-none px-2 text-center">
                <option value="all">YYYY</option>
                {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Panel */}
      {selectedInvoices.length > 0 && (
        <div className="p-4 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-rose-600/20 flex items-center justify-center text-rose-500">
              <Trash2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
              {selectedInvoices.length} Registry Objects Marked for Purge Protocol
            </span>
          </div>
          <Button variant="destructive" size="sm" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-600/20 rounded-xl" onClick={() => setConfirmModal({ type: 'bulkDelete' })}>
            Execute Batch Termination
          </Button>
        </div>
      )}

      {/* Invoice Ledger Table */}
      <div className="app-panel overflow-hidden border border-white/5 bg-slate-900/30 backdrop-blur-3xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-white/10 bg-slate-900 accent-blue-600" 
                    checked={sorted.length > 0 && selectedInvoices.length === sorted.length} 
                    onChange={(e) => setSelectedInvoices(e.target.checked ? sorted.map(i => i.id) : [])} 
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">UID / Protocol Ref</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Entity Metadata</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Settlement Hub</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lifecycle Dates</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Asset Value (₹)</th>
                <th className="px-6 py-4 w-40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.length > 0 ? sorted.map((inv) => {
                const sub = subMap[inv.subscriberId];
                return (
                  <tr key={inv.id} className="hover:bg-blue-600/[0.03] transition-all duration-300 group">
                    <td className="px-6 py-5 text-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-white/10 bg-slate-900 accent-blue-600" 
                        checked={selectedInvoices.includes(inv.id)} 
                        onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} 
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white tracking-widest tabular-nums group-hover:text-blue-400 transition-colors uppercase italic"><Highlight text={inv.number} query={q} /></span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mt-1.5 flex items-center gap-2">
                          <DatabaseZap className="h-3 w-3" /> HASH: {inv.id.slice(0, 10).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-black text-white uppercase italic tracking-tight"><Highlight text={sub?.name || "System Record"} query={q} /></span>
                          <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">#{sub?.customerNo}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-50" /> <Highlight text={sub?.area || "STATIC_REGION"} query={q} /></span>
                          {inv.type === 'legacy' && <span className="text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 italic">Legacy_Data</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="scale-90 origin-left">
                        <StatusBadge status={inv.status} className="h-6 px-3 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-600" />
                          <span className="text-[10px] font-black text-slate-400 tabular-nums uppercase">{formatDate(inv.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <History className="h-3 w-3 text-slate-700" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">DUE: {formatDate(inv.dueDate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-base font-black text-white tracking-tighter tabular-nums italic">{formatCurrency(inv.amount)}</span>
                        {inv.balance > 0 && <span className="text-[9px] font-black uppercase text-rose-500 mt-1.5 tracking-widest">OUTSTANDING: {formatCurrency(inv.balance)}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 text-slate-500 hover:text-white shadow-inner" onClick={() => { setPreviewInv(inv); setShowPreview(true); }}><Eye className="h-4 w-4" /></Button>
                        {inv.status !== 'paid' && <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-600/10" onClick={() => { setPayInv(inv); setCustomAmount(inv.balance); }}><Wallet className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-600/10" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-20">
                      <Activity className="h-16 w-16 text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">NO REGISTRY OBJECTS DETECTED IN SCOPE</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showSubSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-slate-900 border border-white/5 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Plus className="h-32 w-32 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Initialize Record</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">New Protocol Dispatch</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSubSelect(false)} className="h-12 w-12 rounded-2xl text-slate-500 hover:bg-slate-800"><X className="h-6 w-6" /></Button>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Network Region</Label>
                  <select 
                    value={selectedArea} 
                    onChange={(e) => { setSelectedArea(e.target.value); setSelectedSub(""); }} 
                    className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 shadow-inner appearance-none transition-all"
                  >
                    <option value="">SELECT SECTOR...</option>
                    {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a} className="bg-slate-900">{a.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Target Node</Label>
                  <select 
                    value={selectedSub} 
                    onChange={(e) => setSelectedSub(e.target.value)} 
                    disabled={!selectedArea} 
                    className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/50 shadow-inner appearance-none transition-all disabled:opacity-20"
                  >
                    <option value="">SELECT NODE...</option>
                    {subscribers.filter(s => s.area === selectedArea).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id} className="bg-slate-900">#{s.customerNo} {s.name.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Dispatch Schema</Label>
                  <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                    {(["plan", "legacy"] as const).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setBillingType(t)} 
                        className={cn(
                          "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          billingType === t ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-600 hover:text-slate-300"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {billingType === "plan" ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Lifecycle Cycle</Label>
                    <select 
                      value={planMonths} 
                      onChange={(e) => setPlanMonths(Number(e.target.value))} 
                      className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest text-white appearance-none shadow-inner"
                    >
                      {[1,2,3,6,12].map(m => <option key={m} value={m} className="bg-slate-900">{m} CYCLE{m > 1 ? 'S' : ''}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Rebate Adjustment (₹)</Label>
                    <input 
                      type="number" 
                      value={discountAmount || ''} 
                      onChange={(e) => setDiscountAmount(Number(e.target.value))} 
                      className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black text-white outline-none focus:border-blue-500/50 shadow-inner" 
                      placeholder="0.00" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Effective Timestamp</Label>
                <input 
                  type="date" 
                  value={rechargeDate} 
                  onChange={(e) => setRechargeDate(e.target.value)} 
                  className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black text-white outline-none focus:border-blue-500/50 shadow-inner uppercase tracking-widest" 
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all" onClick={() => setShowSubSelect(false)}>Abort Command</Button>
                <Button 
                  onClick={handleGenerateSingle} 
                  disabled={isProcessing || !selectedSub} 
                  className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Activity className="h-5 w-5 mr-2" />}
                  Commit Protocol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Terminal Modal */}
      {payInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Wallet className="h-32 w-32 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                  <Wallet className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Settlement Hub</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Node Transaction Auth</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPayInv(null)} className="h-12 w-12 rounded-2xl text-slate-500 hover:bg-slate-800"><X className="h-6 w-6" /></Button>
            </div>

            <div className="bg-slate-950/80 p-6 rounded-[2.5rem] border border-white/5 mb-8 flex justify-between items-center shadow-inner relative z-10 overflow-hidden group">
               <div className="absolute inset-0 bg-blue-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1.5">Subscriber Identity</p>
                <p className="text-sm font-black text-white uppercase italic tracking-tight">{subMap[payInv.subscriberId]?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1.5">Asset Backlog</p>
                <p className="text-xl font-black text-blue-500 tabular-nums italic tracking-tighter">{formatCurrency(payInv.balance)}</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Method Terminal</Label>
                  <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                    {(["Cash", "UPI"] as const).map(m => (
                      <button 
                        key={m} 
                        onClick={() => setPayMethod(m)} 
                        className={cn(
                          "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          payMethod === m ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-600 hover:text-slate-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Entry Timestamp</Label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)} 
                    className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black text-white outline-none focus:border-blue-500/50 shadow-inner uppercase tracking-widest" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Ledger Rebate (₹)</Label>
                  <input 
                    type="number" 
                    value={payDiscount || ''} 
                    onChange={(e) => setPayDiscount(Number(e.target.value))} 
                    className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-center text-lg font-black text-white outline-none focus:border-blue-500/50 shadow-inner" 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-blue-500 tracking-widest ml-1">Settlement Net (₹)</Label>
                  <input 
                    type="number" 
                    value={customAmount || ''} 
                    onChange={(e) => setCustomAmount(Number(e.target.value))} 
                    className="w-full h-12 bg-slate-900 border border-blue-500/30 rounded-2xl px-4 text-center text-lg font-black text-blue-400 outline-none focus:border-blue-500 transition-all shadow-2xl" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all" onClick={() => setPayInv(null)}>Discard</Button>
                <Button 
                  onClick={handlePay} 
                  disabled={isProcessing} 
                  className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/30 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                  Auth Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Override Prompt */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[4rem] p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]" />
            <div className="h-20 w-20 mx-auto rounded-[2.5rem] bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-rose-600/10 animate-pulse">
              <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-4">Security <span className="text-rose-500">Override</span></h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black leading-loose px-4 mb-10">
              IRREVERSIBLE DATA ERASURE INITIATED. AUTHENTICATE COMMAND EXECUTION.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                className="h-14 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] bg-rose-600 hover:bg-rose-500 shadow-2xl shadow-rose-600/30 transition-all active:scale-95" 
                onClick={() => {
                  if (confirmModal.type === 'bulk') executeBulk();
                  else if (confirmModal.type === 'bulkDelete') executeBulkDelete();
                  else if (confirmModal.id) executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Confirm Termination
              </Button>
              <Button variant="ghost" className="h-14 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all" onClick={() => setConfirmModal(null)}>Abort Command</Button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewInv && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /></div>}>
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
