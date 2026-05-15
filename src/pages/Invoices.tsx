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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage billing and payment collections.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isProcessing}
            className="h-9 border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", isProcessing && "animate-spin")} />
            Sync
          </Button>
          <Button
            onClick={() => setShowSubSelect(true)}
            className="h-9 bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="app-card p-3 flex flex-col lg:flex-row gap-3">
        {/* Search + Status */}
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="h-9 bg-input border-border pl-9 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {/* Status pills */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg border border-border">
            {(["all", "paid", "pending", "overdue"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusF(f)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-semibold capitalize rounded-md transition-colors",
                  statusF === f ? "bg-orange-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {/* Type + Area */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-secondary rounded-lg border border-border">
            {(["all", "plan", "legacy"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeF(t)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-semibold capitalize rounded-md transition-colors",
                  typeF === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <select
            value={areaF}
            onChange={(e) => setAreaF(e.target.value)}
            className="h-9 bg-input border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-400 appearance-none"
          >
            <option value="all">All Areas</option>
            {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-2 py-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground">From</span>
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
            }} className="h-7 bg-transparent border-none text-xs text-foreground outline-none appearance-none">
              {months.map((m, idx) => (
                <option 
                  key={m} 
                  value={m} 
                  disabled={filterStartDate.getFullYear() === filterEndDate.getFullYear() && idx > filterEndDate.getMonth()}
                >
                  {m.slice(0,3)}
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
            }} className="w-14 h-7 bg-transparent border-none text-xs text-foreground outline-none appearance-none">
              {years.map(y => (
                <option key={y} value={y} disabled={y > filterEndDate.getFullYear()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-2 py-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground">To</span>
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
            }} className="h-7 bg-transparent border-none text-xs text-foreground outline-none appearance-none">
              {months.map((m, idx) => (
                <option 
                  key={m} 
                  value={m} 
                  disabled={filterEndDate.getFullYear() === filterStartDate.getFullYear() && idx < filterStartDate.getMonth()}
                >
                  {m.slice(0,3)}
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
            }} className="w-14 h-7 bg-transparent border-none text-xs text-foreground outline-none appearance-none">
              {years.map(y => (
                <option key={y} value={y} disabled={y < filterStartDate.getFullYear()}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button onClick={resetDateRange} className="text-xs font-semibold text-orange-500 hover:text-orange-600 whitespace-nowrap">Reset</button>
        </div>
      </div>

      {/* Bulk Action Panel */}
      {selectedInvoices.length > 0 && (
        <div className="app-card p-3 border-red-200 bg-red-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">
              {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => setConfirmModal({ type: 'bulkDelete' })}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Invoice Ledger Mobile Cards */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {sorted.length > 0 ? sorted.map((inv) => {
          const sub = subMap[inv.subscriberId];
          const dueAmount = getInvoiceDueAmount(inv.id);
          return (
            <div key={inv.id} className="app-card p-4 space-y-3">
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
      <div className="data-table hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="w-12 text-center px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-orange-500"
                    checked={sorted.length > 0 && selectedInvoices.length === sorted.length}
                    onChange={(e) => setSelectedInvoices(e.target.checked ? sorted.map(i => i.id) : [])}
                  />
                </th>
                <th>Invoice Ref</th>
                <th>Subscriber</th>
                <th>Status</th>
                <th>Dates</th>
                <th className="text-right">Amount</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? sorted.map((inv) => {
                const sub = subMap[inv.subscriberId];
                const dueAmount = getInvoiceDueAmount(inv.id);
                return (
                  <tr key={inv.id} className="group">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-orange-500"
                        checked={selectedInvoices.includes(inv.id)}
                        onChange={(e) => setSelectedInvoices(prev => e.target.checked ? [...prev, inv.id] : prev.filter(id => id !== inv.id))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground"><Highlight text={inv.number} query={q} /></span>
                        <span className="text-xs text-muted-foreground mt-0.5 font-mono-num">#{inv.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground"><Highlight text={sub?.name || "Unknown"} query={q} /></span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono-num">#{sub?.customerNo}</span>
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
                        <span className="text-foreground">{formatDate(inv.date)}</span>
                        <span className="text-muted-foreground mt-0.5">Due: {formatDate(inv.dueDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-foreground font-mono-num tabular-nums">{formatCurrency(inv.amount)}</span>
                        {dueAmount > 0 && <span className="text-xs text-red-500 mt-0.5">Due: {formatCurrency(dueAmount)}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1A3C6E] hover:text-[#1B2B4B] hover:bg-slate-100" onClick={() => { setPreviewInv(inv); setShowPreview(true); }} title="Preview Invoice"><Eye className="h-4 w-4" /></Button>
                        {inv.status !== 'paid' && <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F47920] hover:text-[#D96611] hover:bg-orange-50" onClick={() => { setPayInv(inv); setCustomAmount(dueAmount); }} title="Record Payment"><Wallet className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setConfirmModal({ type: 'delete', id: inv.id })} title="Delete Invoice"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No invoices found</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg app-card p-6 sm:p-8 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">New Invoice</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Create a manual invoice</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowSubSelect(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Area</Label>
                  <select 
                    value={selectedArea} 
                    onChange={(e) => { setSelectedArea(e.target.value); setSelectedSub(""); }} 
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-300 transition-colors"
                  >
                    <option value="">Select Area</option>
                    {Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort().map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Subscriber</Label>
                  <select 
                    value={selectedSub} 
                    onChange={(e) => setSelectedSub(e.target.value)} 
                    disabled={!selectedArea} 
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-300 transition-colors disabled:opacity-50"
                  >
                    <option value="">Select Subscriber</option>
                    {subscribers.filter(s => s.area === selectedArea).sort((a,b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>#{s.customerNo} {s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                  <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border">
                    {(["plan", "legacy"] as const).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setBillingType(t)} 
                        className={cn(
                          "flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-colors",
                          billingType === t ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {billingType === "plan" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Duration</Label>
                    <select 
                      value={planMonths} 
                      onChange={(e) => setPlanMonths(Number(e.target.value))} 
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground appearance-none"
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m} {m > 1 ? 'Months' : 'Month'}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Discount (₹)</Label>
                    <input 
                      type="number" 
                      value={discountAmount || ''} 
                      onChange={(e) => setDiscountAmount(Number(e.target.value))} 
                      className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-300" 
                      placeholder="0" 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Effective Date</Label>
                <input 
                  type="date" 
                  value={rechargeDate} 
                  onChange={(e) => setRechargeDate(e.target.value)} 
                  className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-orange-300" 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1 text-muted-foreground hover:text-foreground" onClick={() => setShowSubSelect(false)}>Cancel</Button>
                <Button 
                  onClick={handleGenerateSingle} 
                  disabled={isProcessing || !selectedSub} 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md app-card p-6 sm:p-8 shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Record Payment</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Collect pending dues</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPayInv(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></Button>
            </div>

            <div className="bg-secondary p-4 rounded-xl border border-border mb-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subscriber</p>
                <p className="text-sm font-semibold text-foreground">{subMap[payInv.subscriberId]?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Due Amount</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(getInvoiceDueAmount(payInv.id))}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Method</Label>
                  <div className="flex gap-2 p-1 bg-secondary rounded-lg border border-border">
                    {(["Cash", "UPI"] as const).map(m => (
                      <button 
                        key={m} 
                        onClick={() => setPayMethod(m)} 
                        className={cn(
                          "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                          payMethod === m ? "bg-emerald-600 text-white" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                  <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={(e) => setPaymentDate(e.target.value)} 
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-emerald-500/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Discount (₹)</Label>
                  <input 
                    type="number" 
                    value={payDiscount || ''} 
                    onChange={(e) => setPayDiscount(Number(e.target.value))} 
                    className="w-full h-10 bg-secondary border border-border rounded-lg px-3 text-sm text-foreground outline-none focus:border-emerald-500/50" 
                    placeholder="0" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Paying Amount (₹)</Label>
                  <input 
                    type="number" 
                    value={customAmount || ''} 
                    onChange={(e) => setCustomAmount(Number(e.target.value))} 
                    className="w-full h-10 bg-secondary border border-emerald-500/30 rounded-lg px-3 text-sm font-semibold text-green-600 outline-none focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="flex-1 text-muted-foreground hover:text-foreground" onClick={() => setPayInv(null)}>Cancel</Button>
                <Button 
                  onClick={handlePay} 
                  disabled={isProcessing} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm app-card p-6 text-center shadow-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mb-6">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Delete Record?</h2>
            <p className="text-sm text-muted-foreground mb-8">
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
