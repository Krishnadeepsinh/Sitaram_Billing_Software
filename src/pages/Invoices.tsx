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
  const { 
    invoices, subscribers, payments, plans: plansList, generateInvoice, runBulkBilling, 
    runAutoLegacyBilling, deleteInvoice, bulkDeleteInvoices, recordPayment, companySettings, 
    recalculateBalances, filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate 
  } = useBilling();
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
  const [sortBy, setSortBy] = useState<"date" | "customerNo">("customerNo");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [payDiscount, setPayDiscount] = useState(0);
  const [areaF, setAreaF] = useState<string>("all");

  const autoBillingRun = useRef(false);
  
  useEffect(() => {
    if (filterStartDate.getMonth() === 0 && !autoBillingRun.current) {
      autoBillingRun.current = true;
      runAutoLegacyBilling().finally(() => {});
    } else if (filterStartDate.getMonth() !== 0) {
      autoBillingRun.current = false;
    }
  }, [filterStartDate, runAutoLegacyBilling]);

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
      const inRange = invDate >= filterStartDate && invDate <= filterEndDate;
      const isPastUnpaid = inv.status !== "paid" && invDate < filterStartDate;
      const matchPeriod = inRange || isPastUnpaid;

      return matchQ && matchStatus && matchType && matchPeriod && matchArea;
    });
  }, [debouncedQ, statusF, typeF, areaF, filterStartDate, filterEndDate, invoices, subMap, planMap]);

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

  const getInvoiceDueAmount = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return 0;

    const paidAgainstInvoice = payments
      .filter((payment) => payment.invoiceId === invoiceId)
      .reduce((sum, payment) => {
        return sum + Number(payment.amount || 0) + Number(payment.discount || 0);
      }, 0);

    return Math.max(0, Number(invoice.amount || 0) - paidAgainstInvoice);
  };

  const resetDateRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    setFilterStartDate(start);
    setFilterEndDate(end);
  };

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
    <div className="space-y-6 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
          <p className="text-sm text-slate-400">Manage billing and payment collections.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={isProcessing}
            className="h-10 rounded-lg border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", isProcessing && "animate-spin")} />
            Sync Ledger
          </Button>
          <Button 
            onClick={() => setShowSubSelect(true)}
            className="h-10 rounded-lg bg-orange-500 px-4 text-sm font-medium text-slate-800 hover:bg-orange-600 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search invoices..."
              className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm text-slate-800 placeholder:text-slate-500 focus-visible:ring-orange-400/20 focus-visible:border-orange-300"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-100">
            {(["all", "paid", "pending", "overdue"] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setStatusF(f)} 
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-colors",
                  statusF === f ? "bg-orange-500 text-slate-800" : "text-slate-400 hover:text-slate-700"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-4 space-y-4">
           <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-100">
            {(["all", "plan", "legacy"] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setTypeF(t)} 
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-colors",
                  typeF === t ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-700"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <select 
            value={areaF} 
            onChange={(e) => setAreaF(e.target.value)} 
            className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-600 outline-none focus:border-orange-300 appearance-none"
          >
            <option value="all">All Areas</option>
            {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Date Range</span>
            <button 
              onClick={resetDateRange}
              className="text-xs font-medium text-orange-600 hover:text-orange-500"
            >
              Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2 my-auto">From</span>
              <select value={months[filterStartDate.getMonth()]} onChange={(e) => {
                const monthIndex = months.indexOf(e.target.value);
                const d = new Date(filterStartDate);
                d.setMonth(monthIndex);
                setFilterStartDate(d);
              }} className="flex-1 h-8 bg-transparent border-none text-xs text-slate-600 outline-none appearance-none px-2">
                {months.map(m => <option key={m} value={m} className="bg-white">{m.slice(0, 3)}</option>)}
              </select>
              <div className="w-px h-4 my-auto bg-white/10" />
              <select value={filterStartDate.getFullYear()} onChange={(e) => {
                const d = new Date(filterStartDate);
                d.setFullYear(Number(e.target.value));
                setFilterStartDate(d);
              }} className="w-16 h-8 bg-transparent border-none text-xs text-slate-600 outline-none appearance-none px-2">
                {years.map(y => <option key={y} value={y} className="bg-white">{y}</option>)}
              </select>
            </div>
            <div className="flex gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2 my-auto">To</span>
              <select value={months[filterEndDate.getMonth()]} onChange={(e) => {
                const monthIndex = months.indexOf(e.target.value);
                const d = new Date(filterEndDate);
                d.setMonth(monthIndex + 1);
                d.setDate(0);
                d.setHours(23, 59, 59, 999);
                setFilterEndDate(d);
              }} className="flex-1 h-8 bg-transparent border-none text-xs text-slate-600 outline-none appearance-none px-2">
                {months.map(m => <option key={m} value={m} className="bg-white">{m.slice(0, 3)}</option>)}
              </select>
              <div className="w-px h-4 my-auto bg-white/10" />
              <select value={filterEndDate.getFullYear()} onChange={(e) => {
                const d = new Date(filterEndDate);
                d.setFullYear(Number(e.target.value));
                setFilterEndDate(d);
              }} className="w-16 h-8 bg-transparent border-none text-xs text-slate-600 outline-none appearance-none px-2">
                {years.map(y => <option key={y} value={y} className="bg-white">{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Panel */}
      {selectedInvoices.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">
              {selectedInvoices.length} Invoices selected
            </span>
          </div>
          <Button variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => setConfirmModal({ type: 'bulkDelete' })}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Invoice Ledger Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {sorted.length > 0 ? sorted.map((inv) => {
          const sub = subMap[inv.subscriberId];
          const dueAmount = getInvoiceDueAmount(inv.id);
          return (
            <div key={inv.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-slate-200 bg-slate-50 accent-indigo-600" 
                    checked={selectedInvoices.includes(inv.id)} 
                    onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} 
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800"><Highlight text={sub?.name || "Unknown"} query={q} /></h3>
                    <p className="text-xs text-slate-400"><Highlight text={inv.number} query={q} /></p>
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(inv.date)}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><History className="h-3 w-3" /> Due {formatDate(inv.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800 tabular-nums">{formatCurrency(inv.amount)}</p>
                  {dueAmount > 0 && <p className="text-xs text-red-500 mt-0.5">Due: {formatCurrency(dueAmount)}</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="flex-1 text-slate-400 hover:text-slate-800 bg-slate-50" onClick={() => { setPreviewInv(inv); setShowPreview(true); }}>
                  <Eye className="h-4 w-4 mr-2" /> View
                </Button>
                {inv.status !== 'paid' && (
                  <Button variant="secondary" size="sm" className="flex-1 bg-orange-50 text-orange-600 hover:bg-orange-100" onClick={() => { setPayInv(inv); setCustomAmount(dueAmount); }}>
                    <Wallet className="h-4 w-4 mr-2" /> Pay
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-500 hover:bg-red-50" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        }) : (
          <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No invoices found.
          </div>
        )}
      </div>

      {/* Invoice Ledger Desktop Table */}
      <div className="hidden lg:block rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-slate-200 bg-white accent-indigo-600" 
                    checked={sorted.length > 0 && selectedInvoices.length === sorted.length} 
                    onChange={(e) => setSelectedInvoices(e.target.checked ? sorted.map(i => i.id) : [])} 
                  />
                </th>
                <th className="px-4 py-3 font-medium text-slate-400">Invoice Ref</th>
                <th className="px-4 py-3 font-medium text-slate-400">Subscriber</th>
                <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 font-medium text-slate-400">Dates</th>
                <th className="px-4 py-3 text-right font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length > 0 ? sorted.map((inv) => {
                const sub = subMap[inv.subscriberId];
                const dueAmount = getInvoiceDueAmount(inv.id);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-slate-200 bg-white accent-indigo-600" 
                        checked={selectedInvoices.includes(inv.id)} 
                        onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))} 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800"><Highlight text={inv.number} query={q} /></span>
                        <span className="text-xs text-slate-500 mt-0.5">#{inv.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800"><Highlight text={sub?.name || "Unknown"} query={q} /></span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <span>#{sub?.customerNo}</span>
                          <span>•</span>
                          <span><Highlight text={sub?.area || "No Area"} query={q} /></span>
                          {inv.type === 'legacy' && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 text-[10px]">Legacy</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-xs">
                        <span className="text-slate-600">{formatDate(inv.date)}</span>
                        <span className="text-slate-500 mt-0.5">Due: {formatDate(inv.dueDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(inv.amount)}</span>
                        {dueAmount > 0 && <span className="text-xs text-red-500 mt-0.5">Due: {formatCurrency(dueAmount)}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-800" onClick={() => { setPreviewInv(inv); setShowPreview(true); }}><Eye className="h-4 w-4" /></Button>
                        {inv.status !== 'paid' && <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:text-orange-500 hover:bg-orange-50" onClick={() => { setPayInv(inv); setCustomAmount(dueAmount); }}><Wallet className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-500 hover:bg-red-50" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showSubSelect && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm sm:animate-in sm:fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">New Invoice</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Create a manual invoice</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSubSelect(false)} className="text-slate-400 hover:text-slate-800"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Area</Label>
                  <select 
                    value={selectedArea} 
                    onChange={(e) => { setSelectedArea(e.target.value); setSelectedSub(""); }} 
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none focus:border-orange-300 transition-colors"
                  >
                    <option value="">Select Area</option>
                    {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Subscriber</Label>
                  <select 
                    value={selectedSub} 
                    onChange={(e) => setSelectedSub(e.target.value)} 
                    disabled={!selectedArea} 
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none focus:border-orange-300 transition-colors disabled:opacity-50"
                  >
                    <option value="">Select Subscriber</option>
                    {subscribers.filter(s => s.area === selectedArea).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>#{s.customerNo} {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Type</Label>
                  <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
                    {(["plan", "legacy"] as const).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setBillingType(t)} 
                        className={cn(
                          "flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-colors",
                          billingType === t ? "bg-orange-500 text-slate-800" : "text-slate-400 hover:text-slate-700"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {billingType === "plan" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Duration</Label>
                    <select 
                      value={planMonths} 
                      onChange={(e) => setPlanMonths(Number(e.target.value))} 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 appearance-none"
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m} {m > 1 ? 'Months' : 'Month'}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">Discount (₹)</Label>
                    <input 
                      type="number" 
                      value={discountAmount || ''} 
                      onChange={(e) => setDiscountAmount(Number(e.target.value))} 
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none focus:border-orange-300" 
                      placeholder="0" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Effective Date</Label>
                <input 
                  type="date" 
                  value={rechargeDate} 
                  onChange={(e) => setRechargeDate(e.target.value)} 
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none focus:border-orange-300" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1 text-slate-400 hover:text-slate-800" onClick={() => setShowSubSelect(false)}>Cancel</Button>
                <Button 
                  onClick={handleGenerateSingle} 
                  disabled={isProcessing || !selectedSub} 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-slate-800"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Terminal Modal */}
      {payInv && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm sm:animate-in sm:fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Collect pending dues</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPayInv(null)} className="text-slate-400 hover:text-slate-800"><X className="h-5 w-5" /></Button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 mb-1">Subscriber</p>
                <p className="text-sm font-semibold text-slate-800">{subMap[payInv.subscriberId]?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Due Amount</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(getInvoiceDueAmount(payInv.id))}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Method</Label>
                  <div className="flex gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
                    {(["Cash", "UPI"] as const).map(m => (
                      <button 
                        key={m} 
                        onClick={() => setPayMethod(m)} 
                        className={cn(
                          "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                          payMethod === m ? "bg-emerald-600 text-slate-800" : "text-slate-400 hover:text-slate-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Date</Label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)} 
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none focus:border-emerald-500/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Discount (₹)</Label>
                  <input 
                    type="number" 
                    value={payDiscount || ''} 
                    onChange={(e) => setPayDiscount(Number(e.target.value))} 
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-800 outline-none focus:border-emerald-500/50" 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Paying Amount (₹)</Label>
                  <input 
                    type="number" 
                    value={customAmount || ''} 
                    onChange={(e) => setCustomAmount(Number(e.target.value))} 
                    className="w-full h-10 bg-slate-50 border border-emerald-500/30 rounded-lg px-3 text-sm font-semibold text-green-600 outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1 text-slate-400 hover:text-slate-800" onClick={() => setPayInv(null)}>Cancel</Button>
                <Button 
                  onClick={handlePay} 
                  disabled={isProcessing} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-slate-800"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Override Prompt */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm sm:animate-in sm:fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Record?</h2>
            <p className="text-sm text-slate-400 mb-8">
              This action cannot be undone. This will permanently remove the invoice and its data.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" className="sm:flex-1 text-slate-400 hover:text-slate-800 order-2 sm:order-1" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                className="sm:flex-1 bg-red-500 hover:bg-red-600 order-1 sm:order-2" 
                onClick={() => {
                  if (confirmModal.type === 'bulkDelete') executeBulkDelete();
                  else if (confirmModal.id) executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPreview && previewInv && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>}>
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
