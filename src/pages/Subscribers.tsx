import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Plus, Phone, MapPin, Loader2, Edit2, 
  Trash2, History, FileText, Wifi, ChevronRight,
  Activity, Wallet, X, User, Shield, CreditCard
} from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBusinessMode } from "@/lib/turso";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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
          <mark key={i} className="rounded-sm bg-blue-500/20 px-0.5 font-semibold text-blue-300">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function Subscribers() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const customerIdLabel = isCableMode ? "STB Number" : "Customer ID";
  const { subscribers, plans: dbPlans, invoices, payments, addSubscriber, updateSubscriber, deleteSubscriber, generateInvoice, refreshData } = useBilling();
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 180);
  const [statusF, setStatusF] = useState<"all" | "active" | "inactive">("all");
  const [areaF, setAreaF] = useState("all");
  const [planF, setPlanF] = useState("all");
  const [showDuesOnly, setShowDuesOnly] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', phone: '', area: '', planId: 'p1', customerId: '', customerUsername: '', customerPassword: '', email: '', status: 'active' as any,
    houseNo: '', landmark: '', installationDate: new Date().toISOString().split('T')[0],
    openingBalance: 0,
    openingBalanceType: 'debit' as 'debit' | 'credit'
  });
  const [isSaving, setIsSaving] = useState(false);
   const [confirmModal, setConfirmModal] = useState<{type: 'delete', id: string} | null>(null);
   const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
   const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceSub, setInvoiceSub] = useState<any>(null);
  const [rechargeDate, setRechargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [planMonths, setPlanMonths] = useState(1);
  const [billingType, setBillingType] = useState<"plan" | "legacy">("plan");

  const isValidRechargeDate = /^\d{4}-\d{2}-\d{2}$/.test(rechargeDate) && !Number.isNaN(new Date(`${rechargeDate}T12:00:00`).getTime());
  const projectedExpiryDate = useMemo(() => {
    if (billingType !== "plan" || !isValidRechargeDate) return "";
    const selectedPlanForRecharge = dbPlans.find(p => p.id === invoiceSub?.planId);
    if (!selectedPlanForRecharge) return "";
    const start = new Date(`${rechargeDate}T12:00:00`);
    start.setDate(start.getDate() + Math.max(1, Number(selectedPlanForRecharge.validityDays || 30) * planMonths) - 1);
    return start.toISOString();
  }, [billingType, isValidRechargeDate, rechargeDate, invoiceSub, planMonths, dbPlans]);

  const areas = useMemo(() => ["all", ...new Set(subscribers.map(s => s.area || "Unknown"))], [subscribers]);

  const effectiveBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sub of subscribers) {
      const totalInvoiced = invoices
        .filter(i => i.subscriberId === sub.id)
        .reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalPaid = payments
        .filter(p => p.subscriberId === sub.id)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      map[sub.id] = totalPaid - totalInvoiced - Number(sub.openingBalance || 0);
    }
    return map;
  }, [subscribers, invoices, payments]);

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      const tokens = debouncedQ.toLowerCase().split(/\s+/).filter(Boolean);
      const matchQ = tokens.length === 0 || tokens.every(token => {
        return (
          (s.name || "").toLowerCase().includes(token) ||
          (s.code || "").toLowerCase().includes(token) ||
          (s.phone || "").includes(token) ||
          (s.customerId || "").toLowerCase().includes(token) ||
          (s.customerUsername || "").toLowerCase().includes(token) ||
          (s.area || "").toLowerCase().includes(token)
        );
      });
      
      const sStatus = String(s.status || "").toLowerCase().trim();
      const matchStatus = statusF === "all" || 
                         (statusF === "active" && sStatus === "active") || 
                         (statusF === "inactive" && (sStatus === "inactive" || sStatus === "expired"));
                         
      const matchArea = areaF === "all" || s.area === areaF;
      const matchPlan = planF === "all" || s.planId === planF;
      const matchDues = !showDuesOnly || (effectiveBalances[s.id] ?? 0) < 0;

      return matchQ && matchStatus && matchArea && matchPlan && matchDues;
    }).sort((a, b) => (a.customerNo || 0) - (b.customerNo || 0));
  }, [debouncedQ, statusF, areaF, planF, showDuesOnly, subscribers, effectiveBalances]);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({ 
      name: '', phone: '', area: '', planId: dbPlans[0]?.id || 'p1', customerId: '', customerUsername: '', customerPassword: '', email: '', status: 'active',
      houseNo: '', landmark: '', installationDate: new Date().toISOString().split('T')[0],
      openingBalance: 0,
      openingBalanceType: 'debit'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sub: any) => {
    setEditingSub(sub);
    const ob = sub.openingBalance || 0;
    setFormData({ 
      name: sub.name, phone: sub.phone, area: sub.area, planId: sub.planId, customerId: sub.customerId || '', customerUsername: sub.customerUsername || '', customerPassword: sub.customerPassword || '', email: sub.email || '', status: sub.status,
      houseNo: sub.houseNo || '', landmark: sub.landmark || '', installationDate: sub.installationDate || '',
      openingBalance: Math.abs(ob),
      openingBalanceType: ob < 0 ? 'credit' : 'debit'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error("Please enter a 10-digit mobile number");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    const { openingBalanceType, ...rest } = formData;
    const finalOpeningBalance = openingBalanceType === 'credit' 
      ? -Math.abs(formData.openingBalance) 
      : Math.abs(formData.openingBalance);

    try {
      if (editingSub) {
        await updateSubscriber(editingSub.id, { ...rest, openingBalance: finalOpeningBalance });
      } else {
        await addSubscriber({ ...rest, openingBalance: finalOpeningBalance, status: formData.status || 'active' });
      }
      await refreshData();
      toast.success(editingSub ? "Profile Updated" : "Account Created");
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || "Operation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteSubscriber(id);
      toast.success("Account Terminated");
    } catch (e) {
      toast.error("Deletion failed");
    }
  };

  const handleOpenInvoice = (sub: any) => {
    setInvoiceSub(sub);
    setRechargeDate(new Date().toISOString().slice(0, 10));
    setPlanMonths(1);
    setBillingType("plan");
    setShowInvoiceModal(true);
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceSub) return;
    setIsSaving(true);
    try {
      const isLegacy = billingType === "legacy";
      const startDate = rechargeDate ? new Date(`${rechargeDate}T12:00:00`) : new Date();
      await generateInvoice(invoiceSub.id, isLegacy ? 0 : planMonths, false, startDate, isLegacy);
      toast.success(isLegacy ? "Legacy invoice created" : "Invoice created");
      setShowInvoiceModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const [showHistory, setShowHistory] = useState(false);
  const [historySub, setHistorySub] = useState<any>(null);

  const subPayments = useMemo(() => {
    if (!historySub) return [];
    return payments.filter(p => p.subscriberId === historySub.id)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [historySub, payments]);

  return (
    <div className="space-y-4 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="app-eyebrow mb-1 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            {activeBusinessMode === "cable" ? "Cable" : "Broadband"} subscribers
          </p>
          <h1 className="app-page-title">Subscriber directory</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            className="h-9 rounded-lg border-slate-800 bg-slate-900/60 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800" 
            onClick={async () => {
              setIsGlobalRefreshing(true);
              try {
                await refreshData();
                toast.success("Data refreshed");
              } finally {
                setIsGlobalRefreshing(false);
              }
            }}
          >
            <Loader2 className={cn("mr-2 h-3.5 w-3.5", isGlobalRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" /> Add subscriber
          </Button>
        </div>
      </div>

      {/* COMPACT FILTERS */}
      <div className="app-panel flex flex-col gap-2 p-2 lg:flex-row lg:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-blue-500 transition-all" />
          <Input
            placeholder="Search by name, ID, or phone..."
            className="h-9 rounded-lg border-slate-800 bg-slate-950/50 pl-9 text-sm text-white placeholder:text-slate-600 focus-visible:border-blue-500/40 focus-visible:ring-blue-500/20"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button 
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <select 
              className="h-8 min-w-[100px] cursor-pointer rounded-md border-none bg-transparent px-2 text-xs font-medium text-slate-300 focus:outline-none focus:ring-0"
              value={statusF}
              onChange={(e: any) => setStatusF(e.target.value)}
            >
              <option value="all" className="bg-slate-900 text-white">All Status</option>
              <option value="active" className="bg-slate-900 text-white">Active</option>
              <option value="inactive" className="bg-slate-900 text-white">Inactive</option>
            </select>
            <div className="w-px h-2.5 bg-slate-800" />
            <select 
              className="h-8 min-w-[100px] cursor-pointer rounded-md border-none bg-transparent px-2 text-xs font-medium text-slate-300 focus:outline-none focus:ring-0"
              value={areaF}
              onChange={(e) => setAreaF(e.target.value)}
            >
              <option value="all" className="bg-slate-900 text-white">All Areas</option>
              {areas.map(a => <option key={a} value={a} className="bg-slate-900 text-white">{a}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-3 h-8.5 rounded-lg border border-slate-800">
            <Switch 
              id="dues-only" 
              checked={showDuesOnly} 
              onCheckedChange={setShowDuesOnly}
              className="scale-75 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="dues-only" className="cursor-pointer text-xs font-medium text-slate-500 select-none">Overdue only</Label>
          </div>
        </div>
      </div>

      <div className="hidden md:block app-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70">
                <th className="app-table-th px-4 py-3">ID</th>
                <th className="app-table-th px-4 py-3">Subscriber</th>
                <th className="app-table-th px-4 py-3">Network</th>
                <th className="app-table-th px-4 py-3">Balance</th>
                <th className="app-table-th px-4 py-3">Status</th>
                <th className="app-table-th px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((s) => {
                const plan = dbPlans.find(p => p.id === s.planId);
                const balance = effectiveBalances[s.id] || 0;
                
                return (
                  <tr key={s.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className={cn(
                        "h-6 w-6 rounded flex items-center justify-center font-display font-black text-[9px] text-white border border-white/5 shadow-inner",
                        balance >= 0 ? "bg-slate-800" : "bg-blue-600 shadow-blue-600/20"
                      )}>
                        {s.customerNo || '?'}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs tracking-tight text-white leading-none"><Highlight text={s.name} query={q} /></span>
                        <span className="text-[9px] font-black text-slate-500 flex items-center gap-1 mt-1">
                          <Phone className="h-2.5 w-2.5 text-slate-700" /> {s.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 leading-none"><Highlight text={s.customerId || "N/A"} query={q} /></span>
                        <span className="text-[8px] font-black text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="h-2.5 w-2.5 opacity-50" /> <Highlight text={s.area} query={q} />
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-2 py-0.5 rounded-md font-mono font-black text-[9px] border",
                          balance >= 0 
                            ? "bg-blue-600/10 text-blue-500 border-blue-600/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-lg shadow-rose-500/5"
                        )}>
                          {formatCurrency(balance)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">{plan?.name || "No Plan"}</span>
                          <span className="text-[8px] font-black text-slate-400">{formatCurrency(plan?.price || 0)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge 
                        status={s.status} 
                        isLoading={updatingStatus[s.id]}
                        onClick={async () => {
                          const currentStatus = String(s.status || "").toLowerCase().trim();
                          const newStatus = (currentStatus === 'active') ? 'inactive' : 'active';
                          setUpdatingStatus(prev => ({ ...prev, [s.id]: true }));
                          try {
                            await updateSubscriber(s.id, { status: newStatus });
                            toast.success(`${s.name} is now ${newStatus}`);
                          } catch (err) {
                            toast.error("Status update failed");
                          } finally {
                            setUpdatingStatus(prev => ({ ...prev, [s.id]: false }));
                          }
                        }}
                        className="h-5 px-2 text-[7px] uppercase tracking-widest"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-800 text-slate-600 hover:text-blue-500 transition-all"
                          onClick={() => handleOpenHistory(s)}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-blue-600/10 text-slate-600 hover:text-blue-600 transition-all"
                          onClick={() => handleOpenInvoice(s)}
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-slate-800 text-slate-600 hover:text-white transition-all"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 transition-all"
                          onClick={() => setConfirmModal({ type: 'delete', id: s.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS SECTION */}
      {showHistory && historySub && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-4xl p-8 rounded-[3rem] shadow-2xl border border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                  <History className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{historySub.name}</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">Ledger Transaction History</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-800" onClick={() => setShowHistory(false)}>
                <X className="h-6 w-6 text-slate-500" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {subPayments.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-600 bg-slate-950/40 rounded-[2.5rem] border-2 border-dashed border-slate-800/50">
                  <Wallet className="h-12 w-12 mb-4 opacity-10" />
                  <p className="text-xs font-black uppercase tracking-widest">No transactions logged</p>
                </div>
              ) : (
                subPayments.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl border border-slate-800/50 bg-slate-950/30 flex items-center justify-between hover:bg-slate-950 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-105 transition-transform">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-mono font-black text-white text-base leading-none tracking-tighter">{formatCurrency(p.amount)}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1.5 flex items-center gap-2">
                          <span className="text-blue-500">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-800" />
                          <span>{p.method}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-1">Receipt Hash</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase">{p.id.slice(0, 12)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && invoiceSub && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md p-8 rounded-[3.5rem] shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Billing Protocol</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1.5">{invoiceSub.name}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
                <button
                  onClick={() => setBillingType("plan")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 rounded-xl transition-all font-black uppercase text-[9px] tracking-widest",
                    billingType === "plan" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:text-white"
                  )}
                >
                  <Wifi className="h-3.5 w-3.5" /> Plan Recharge
                </button>
                <button
                  disabled={!(invoiceSub.openingBalance && Number(invoiceSub.openingBalance) > 0)}
                  onClick={() => setBillingType("legacy")}
                  className={cn(
                    "flex items-center justify-center gap-2 h-11 rounded-xl transition-all font-black uppercase text-[9px] tracking-widest disabled:opacity-20",
                    billingType === "legacy" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-600 hover:text-white"
                  )}
                >
                  <History className="h-3.5 w-3.5" /> Legacy Due
                </button>
              </div>

              {billingType === "plan" ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-600 tracking-widest ml-1">Start Date</Label>
                      <Input
                         type="date"
                         value={rechargeDate}
                         onChange={(e) => setRechargeDate(e.target.value)}
                         className="h-10 rounded-xl border-slate-800 bg-slate-950 text-white font-black text-xs focus:border-blue-600/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-600 tracking-widest ml-1">Validity Months</Label>
                      <select
                        value={planMonths}
                        onChange={(e) => setPlanMonths(Number(e.target.value))}
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 text-white font-black px-3 outline-none focus:border-blue-600/50 text-xs"
                      >
                        {[1,2,3,6,12].map(m => (
                          <option key={m} value={m} className="bg-slate-900">{m} {m === 1 ? 'Month' : 'Months'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-5 rounded-3xl bg-slate-950/60 border border-slate-800/50 space-y-3 shadow-inner">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <span>Selected Network Plan</span>
                      <span className="text-white">{dbPlans.find(p => p.id === invoiceSub.planId)?.name}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <span>Cycle Termination</span>
                      <span className="text-blue-500 font-mono">{formatDate(projectedExpiryDate || "")}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-black text-white pt-4 border-t border-slate-800">
                      <span className="text-xs uppercase tracking-widest text-slate-500">Total Billing</span>
                      <span className="font-mono">{formatCurrency((dbPlans.find(p => p.id === invoiceSub.planId)?.price || 0) * planMonths)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-indigo-600/5 border border-indigo-600/10 space-y-4">
                  <div className="flex items-center gap-3 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                    <Shield className="h-4 w-4" /> System Recovery Invoice
                  </div>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-wide leading-relaxed">
                    Generating protocol to formalize existing opening debt.
                  </p>
                  <div className="flex justify-between items-center text-xl font-black text-white pt-4 border-t border-indigo-600/20">
                    <span className="text-xs uppercase tracking-widest text-slate-500">Outstanding</span>
                    <span className="text-indigo-500 font-mono">{formatCurrency(invoiceSub.openingBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-10">
              <Button variant="ghost" className="flex-1 h-11 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-600 hover:text-white" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerateInvoice} 
                disabled={isSaving} 
                className="flex-1 h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 font-black uppercase tracking-widest text-[9px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                Execute Protocol
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 w-full max-w-3xl p-10 rounded-[4rem] shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-300 my-8">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                  {editingSub ? <User className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">{editingSub ? "Update Profile" : "Network Registry"}</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Registry & Authentication Identity</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-800" onClick={() => setShowModal(false)}>
                <X className="h-7 w-7 text-slate-600" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2 flex items-center gap-2">
                   <User className="h-3 w-3" /> Personal Identity
                </h3>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Full Subscriber Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Legal name as per registry" 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Contact Terminal</Label>
                  <Input 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="10-digit mobile number" 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-mono font-black text-xs text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Service Area Code</Label>
                  <Input 
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                    placeholder="Sector / Zone / Area" 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white uppercase"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2 flex items-center gap-2">
                   <Shield className="h-3 w-3" /> Network Config
                </h3>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">{customerIdLabel} / MAC</Label>
                  <Input 
                    value={formData.customerId}
                    onChange={e => setFormData({...formData, customerId: e.target.value})}
                    placeholder="Hardware identifier" 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">System Provisioning</Label>
                  <select 
                    value={formData.planId}
                    onChange={e => setFormData({...formData, planId: e.target.value})}
                    className="h-11 w-full rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-xs px-4 outline-none focus:border-blue-600/50 transition-all"
                  >
                    {dbPlans.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name.toUpperCase()} — {formatCurrency(p.price)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Activation Status</Label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="h-11 w-full rounded-xl bg-slate-950 border border-slate-800 text-white font-black text-xs px-4 outline-none focus:border-blue-600/50 transition-all"
                  >
                    <option value="active" className="bg-slate-900">OPERATIONAL</option>
                    <option value="inactive" className="bg-slate-900">TERMINATED</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-slate-800/50 mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-6 flex items-center gap-2">
                <CreditCard className="h-3 w-3" /> Financial Initializer
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Opening Statement</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number"
                      value={formData.openingBalance || ''}
                      onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}
                      placeholder="0.00" 
                      className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-mono font-black text-xs text-white flex-1"
                    />
                    <select
                      value={formData.openingBalanceType}
                      onChange={e => setFormData({...formData, openingBalanceType: e.target.value as any})}
                      className="h-11 rounded-xl bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-widest text-white px-3 outline-none focus:border-blue-600/50"
                    >
                      <option value="debit">DUE (DR)</option>
                      <option value="credit">ADV (CR)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Installation Timestamp</Label>
                  <Input 
                    type="date"
                    value={formData.installationDate}
                    onChange={e => setFormData({...formData, installationDate: e.target.value})}
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-white" onClick={() => setShowModal(false)}>Discard</Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="h-12 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 font-black text-[10px] uppercase tracking-widest"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                {editingSub ? "Sync Profile" : "Establish Account"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TERMINATION CONFIRMATION */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200 text-center">
            <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-inner mx-auto mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">Terminate Account?</h2>
            <p className="text-slate-500 mb-8 font-black text-[10px] uppercase tracking-widest leading-relaxed">
              Permanent registry erasure initiated. All associated financial and network logs will be purged.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="destructive" 
                className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-600/20"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Execute Termination
              </Button>
              <Button variant="ghost" className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-white" onClick={() => setConfirmModal(null)}>Abort Command</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
