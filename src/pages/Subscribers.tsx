import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Plus, Phone, MapPin, Loader2, Edit2, 
  Trash2, History, FileText, Wifi, ChevronRight,
  Activity, Wallet, X, User, Shield, CreditCard,
  Network, Signal, Globe, ArrowUpRight, Zap, DatabaseZap,
  ShieldCheck, LayoutGrid, ListFilter
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

  const [showHistory, setShowHistory] = useState(false);
  const [historySub, setHistorySub] = useState<any>(null);

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
      toast.success(editingSub ? "Sync Successful" : "New Node Established");
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
      toast.success("Registry Record Expunged");
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
      toast.success(isLegacy ? "Recovery Log Created" : "Invoice Dispatched");
      setShowInvoiceModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenHistory = (sub: any) => {
    setHistorySub(sub);
    setShowHistory(true);
  };

  const subPayments = useMemo(() => {
    if (!historySub) return [];
    return payments.filter(p => p.subscriberId === historySub.id)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [historySub, payments]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-16">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 w-fit">
            <Globe className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80">Network Registry Control</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
            Node <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Database</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Subscriber Management & Service Lifecycle</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="h-12 rounded-xl border-white/5 bg-slate-900/40 px-6 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition-all backdrop-blur-xl" 
            onClick={async () => {
              setIsGlobalRefreshing(true);
              try {
                await refreshData();
                toast.success("Network Data Synced");
              } finally {
                setIsGlobalRefreshing(false);
              }
            }}
          >
            <Loader2 className={cn("mr-2 h-4 w-4", isGlobalRefreshing && "animate-spin")} />
            Sync Hub
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="h-12 rounded-xl bg-blue-600 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> Provision New Node
          </Button>
        </div>
      </div>

      {/* Industrial Filters */}
      <div className="app-panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-all" />
          <Input
            placeholder="FILTER NODES BY NAME, ID, MAC OR TERMINAL..."
            className="h-12 rounded-xl border-white/5 bg-slate-950/50 pl-12 text-[11px] font-bold tracking-widest text-white placeholder:text-slate-600 focus-visible:border-blue-500/40 focus-visible:ring-blue-500/10 transition-all uppercase"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button 
              onClick={() => setQ("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/5 backdrop-blur-xl">
            <select 
              className="h-9 min-w-[120px] cursor-pointer rounded-lg border-none bg-transparent px-3 text-[10px] font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:ring-0 appearance-none"
              value={statusF}
              onChange={(e: any) => setStatusF(e.target.value)}
            >
              <option value="all" className="bg-slate-900 text-white">ALL STATUS</option>
              <option value="active" className="bg-slate-900 text-white">OPERATIONAL</option>
              <option value="inactive" className="bg-slate-900 text-white">TERMINATED</option>
            </select>
            <div className="w-px h-5 bg-white/5" />
            <select 
              className="h-9 min-w-[120px] cursor-pointer rounded-lg border-none bg-transparent px-3 text-[10px] font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:ring-0 appearance-none"
              value={areaF}
              onChange={(e) => setAreaF(e.target.value)}
            >
              <option value="all" className="bg-slate-900 text-white">ALL SECTORS</option>
              {areas.filter(a => a !== "all").map(a => <option key={a} value={a} className="bg-slate-900 text-white">{a.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 px-4 h-12 rounded-xl border border-white/5 backdrop-blur-xl">
            <Switch 
              id="dues-only" 
              checked={showDuesOnly} 
              onCheckedChange={setShowDuesOnly}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="dues-only" className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-slate-500 select-none">Show Overdue</Label>
          </div>
        </div>
      </div>

      {/* Subscriber Table */}
      <div className="app-panel overflow-hidden border border-white/5 bg-slate-900/30 backdrop-blur-3xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Subscriber Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Network Metadata</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ledger Statement</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Operational Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Command Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => {
                const plan = dbPlans.find(p => p.id === s.planId);
                const balance = effectiveBalances[s.id] || 0;
                
                return (
                  <tr key={s.id} className="hover:bg-blue-600/[0.03] transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs text-white border border-white/5 shadow-inner transition-all group-hover:scale-110",
                        balance >= 0 ? "bg-slate-800" : "bg-blue-600 shadow-xl shadow-blue-600/20"
                      )}>
                        {s.customerNo || '?'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-sm tracking-tight text-white uppercase italic group-hover:text-blue-400 transition-colors"><Highlight text={s.name} query={q} /></span>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone className="h-3 w-3 text-slate-600" />
                          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{s.phone || 'NO_TERMINAL'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Network className="h-3 w-3 text-blue-500/60" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-blue-500/80 italic"><Highlight text={s.customerId || "N/A"} query={q} /></span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="h-3 w-3 text-slate-700" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest"><Highlight text={s.area} query={q} /></span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "px-3 py-1.5 rounded-xl font-mono font-black text-[11px] border shadow-sm",
                          balance >= 0 
                            ? "bg-blue-600/10 text-blue-400 border-blue-600/20" 
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                          {formatCurrency(balance)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">{plan?.name || "UNASSIGNED"}</span>
                          <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">{formatCurrency(plan?.price || 0)} CYCLE</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge 
                        status={s.status} 
                        isLoading={updatingStatus[s.id]}
                        onClick={async () => {
                          const currentStatus = String(s.status || "").toLowerCase().trim();
                          const newStatus = (currentStatus === 'active') ? 'inactive' : 'active';
                          setUpdatingStatus(prev => ({ ...prev, [s.id]: true }));
                          try {
                            await updateSubscriber(s.id, { status: newStatus });
                          } catch (err) {
                            toast.error("Sync Failure");
                          } finally {
                            setUpdatingStatus(prev => ({ ...prev, [s.id]: false }));
                          }
                        }}
                        className="h-6 px-3 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg cursor-pointer hover:scale-105 transition-transform"
                      />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 text-slate-500 hover:text-blue-500 transition-all shadow-inner"
                          onClick={() => handleOpenHistory(s)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-600/10"
                          onClick={() => handleOpenInvoice(s)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 text-slate-500 hover:text-white transition-all shadow-inner"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-600/10"
                          onClick={() => setConfirmModal({ type: 'delete', id: s.id })}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* History Modal */}
      {showHistory && historySub && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-4xl p-12 rounded-[4rem] shadow-2xl border border-white/5 flex flex-col max-h-[85vh] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <History className="h-64 w-64 text-blue-500" />
            </div>
            
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div className="flex items-center gap-8">
                <div className="h-20 w-20 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-2xl">
                  <History className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{historySub.name}</h2>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" /> TRANSACTION_AUDIT_LOG_RECOVERY
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl hover:bg-slate-800 border border-white/5 shadow-inner" onClick={() => setShowHistory(false)}>
                <X className="h-8 w-8 text-slate-500" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-5 relative z-10">
              {subPayments.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-800 bg-slate-950/40 rounded-[3rem] border-2 border-dashed border-white/5">
                  <Wallet className="h-20 w-20 mb-8 opacity-10" />
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">No persistent ledger records</p>
                </div>
              ) : (
                subPayments.map(p => (
                  <div key={p.id} className="p-6 rounded-[2rem] border border-white/5 bg-slate-950/30 flex items-center justify-between hover:bg-slate-950 transition-all group shadow-inner">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-blue-500 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-mono font-black text-blue-400 text-2xl leading-none tracking-tight">+{formatCurrency(p.amount)}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mt-3 flex items-center gap-3 italic">
                          <span className="text-slate-200">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600/30" />
                          <span>{p.method.toUpperCase()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-3 mb-3">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Verified Dispatch</span>
                      </div>
                      <p className="text-[11px] font-mono font-black text-slate-500 bg-slate-900/50 px-4 py-1.5 rounded-xl border border-white/5 uppercase tracking-widest italic">{p.id.slice(0, 16)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoiceModal && invoiceSub && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-slate-900 w-full max-w-lg p-12 rounded-[5rem] shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <FileText className="h-40 w-40 text-blue-500" />
            </div>
            
            <div className="flex items-center gap-6 mb-12 relative z-10">
              <div className="h-16 w-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-2xl shadow-blue-600/10">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Billing Dispatch</h2>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 italic">{invoiceSub.name.toUpperCase()}</p>
              </div>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-950 border border-white/5 rounded-3xl shadow-inner">
                <button
                  onClick={() => setBillingType("plan")}
                  className={cn(
                    "flex items-center justify-center gap-3 h-14 rounded-2xl transition-all font-black uppercase text-[10px] tracking-[0.2em]",
                    billingType === "plan" ? "bg-blue-600 text-white shadow-2xl shadow-blue-600/20" : "text-slate-600 hover:text-slate-300"
                  )}
                >
                  <Signal className="h-5 w-5" /> Cycle Recharge
                </button>
                <button
                  disabled={!(invoiceSub.openingBalance && Number(invoiceSub.openingBalance) > 0)}
                  onClick={() => setBillingType("legacy")}
                  className={cn(
                    "flex items-center justify-center gap-3 h-14 rounded-2xl transition-all font-black uppercase text-[10px] tracking-[0.2em] disabled:opacity-10",
                    billingType === "legacy" ? "bg-blue-800 text-white shadow-2xl shadow-blue-800/20" : "text-slate-600 hover:text-slate-300"
                  )}
                >
                  <History className="h-5 w-5" /> Recovery
                </button>
              </div>

              {billingType === "plan" ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] ml-2">Dispatch Date</Label>
                      <Input
                         type="date"
                         value={rechargeDate}
                         onChange={(e) => setRechargeDate(e.target.value)}
                         className="h-14 rounded-2xl border-white/5 bg-slate-950 text-white font-black text-[13px] focus:border-blue-500/50 uppercase shadow-inner"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] ml-2">Cycle Scope</Label>
                      <select
                        value={planMonths}
                        onChange={(e) => setPlanMonths(Number(e.target.value))}
                        className="h-14 w-full rounded-2xl border border-white/5 bg-slate-950 text-white font-black px-6 outline-none focus:border-blue-500/50 text-[13px] uppercase shadow-inner appearance-none"
                      >
                        {[1,2,3,6,12].map(m => (
                          <option key={m} value={m} className="bg-slate-900">{m} {m > 1 ? 'CYCLES' : 'CYCLE'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-8 rounded-[3.5rem] bg-slate-950/60 border border-white/5 space-y-5 shadow-2xl relative group">
                    <div className="absolute top-0 left-0 w-full h-full bg-blue-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 relative z-10">
                      <span>Service Protocol</span>
                      <span className="text-white italic tracking-widest">{dbPlans.find(p => p.id === invoiceSub.planId)?.name}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 relative z-10">
                      <span>Node Expiration</span>
                      <span className="text-blue-500 font-mono italic tracking-widest">{formatDate(projectedExpiryDate || "")}</span>
                    </div>
                    <div className="flex justify-between items-center text-4xl font-black text-white pt-8 border-t border-white/5 relative z-10">
                      <span className="text-[11px] uppercase tracking-[0.4em] text-slate-700 italic">Net Due</span>
                      <span className="font-mono tracking-tighter italic text-blue-400">{formatCurrency((dbPlans.find(p => p.id === invoiceSub.planId)?.price || 0) * planMonths)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 rounded-[4rem] bg-blue-600/[0.03] border border-blue-500/10 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 opacity-[0.05]">
                    <Shield className="h-32 w-32 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-4 text-blue-400 font-black text-[12px] uppercase tracking-[0.3em] italic">
                    <Shield className="h-6 w-6 animate-pulse" /> Legacy Recovery Mode
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-loose italic">
                    EXECUTING MANUAL SETTLEMENT FOR PRE-EXISTING DEBIT STATEMENT.
                  </p>
                  <div className="flex justify-between items-center text-4xl font-black text-white pt-8 border-t border-white/10">
                    <span className="text-[11px] uppercase tracking-[0.4em] text-slate-700 italic">Settlement</span>
                    <span className="text-blue-500 font-mono tracking-tighter italic">{formatCurrency(invoiceSub.openingBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-6 mt-12 relative z-10">
              <Button variant="ghost" className="flex-1 h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] text-slate-600 hover:text-white transition-all" onClick={() => setShowInvoiceModal(false)}>Abort Protocol</Button>
              <Button 
                onClick={handleGenerateInvoice} 
                disabled={isSaving} 
                className="flex-1 h-16 rounded-3xl bg-blue-600 text-white hover:bg-blue-500 shadow-2xl shadow-blue-600/30 font-black uppercase tracking-[0.3em] text-[11px] active:scale-95 transition-all"
              >
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ChevronRight className="h-6 w-6" />}
                Commit Dispatch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Subscriber Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[60] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="bg-slate-900 w-full max-w-4xl p-16 rounded-[6rem] shadow-2xl border border-white/5 my-10 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-600 to-transparent shadow-[0_0_30px_rgba(37,99,235,0.6)]" />
            
            <div className="flex justify-between items-center mb-16 relative z-10">
              <div className="flex items-center gap-8">
                <div className="h-20 w-20 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-2xl">
                  {editingSub ? <Edit2 className="h-10 w-10" /> : <Network className="h-10 w-10" />}
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">{editingSub ? "Modify Node" : "Provision Node"}</h2>
                  <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.5em] mt-4 flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-500" /> SYSTEM_REGISTRY_PROTOCOL_v4
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-16 w-16 rounded-3xl hover:bg-slate-800 border border-white/5 shadow-inner" onClick={() => setShowModal(false)}>
                <X className="h-10 w-10 text-slate-600" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-6 custom-scrollbar space-y-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-10">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-500 mb-4 flex items-center gap-4 italic">
                     <User className="h-5 w-5" /> IDENTITY_PARAMETERS
                  </h3>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Subscriber Alias</Label>
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="ENTER LEGAL IDENTITY..." 
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 focus:border-blue-500/50 font-black text-[13px] text-white tracking-widest uppercase shadow-inner px-6"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Terminal Link (Phone)</Label>
                    <Input 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="10-DIGIT HARDWARE LINK..." 
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 focus:border-blue-500/50 font-mono font-black text-[13px] text-white tracking-[0.3em] shadow-inner px-6"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Geographic Sector</Label>
                    <Input 
                      value={formData.area}
                      onChange={e => setFormData({...formData, area: e.target.value})}
                      placeholder="ZONE / SECTOR / REGION..." 
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 focus:border-blue-500/50 font-black text-[13px] text-white uppercase tracking-widest shadow-inner px-6"
                    />
                  </div>
                </div>

                <div className="space-y-10">
                  <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-500 mb-4 flex items-center gap-4 italic">
                     <Signal className="h-5 w-5" /> LINK_METADATA_v4
                  </h3>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Hardware ID / MAC Hash</Label>
                    <Input 
                      value={formData.customerId}
                      onChange={e => setFormData({...formData, customerId: e.target.value})}
                      placeholder="NETWORK ADAPTER HASH..." 
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 focus:border-blue-500/50 font-black text-[13px] text-white uppercase tracking-widest shadow-inner px-6 italic"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Allocated Tier</Label>
                    <select 
                      value={formData.planId}
                      onChange={e => setFormData({...formData, planId: e.target.value})}
                      className="h-14 w-full rounded-2xl bg-slate-950 border border-white/5 text-white font-black text-[13px] px-8 outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest shadow-inner appearance-none"
                    >
                      {dbPlans.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name.toUpperCase()} — {formatCurrency(p.price)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Network Permissions</Label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                      className="h-14 w-full rounded-2xl bg-slate-950 border border-white/5 text-white font-black text-[13px] px-8 outline-none focus:border-blue-500/50 transition-all uppercase tracking-widest shadow-inner appearance-none"
                    >
                      <option value="active" className="bg-slate-900 text-blue-400">OPERATIONAL_NODE</option>
                      <option value="inactive" className="bg-slate-900 text-rose-500">TERMINATED_NODE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-12 rounded-[4rem] border border-white/5 shadow-inner relative group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                  <DatabaseZap className="h-40 w-40 text-blue-500" />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-500 mb-10 flex items-center gap-4 italic relative z-10">
                  <CreditCard className="h-6 w-6" /> INITIALIZATION_LEDGER
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 relative z-10">
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Opening Statement Balance</Label>
                    <div className="flex gap-4">
                      <Input 
                        type="number"
                        value={formData.openingBalance || ''}
                        onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}
                        placeholder="0.00" 
                        className="h-14 rounded-2xl bg-slate-950 border-white/5 focus:border-blue-500/50 font-mono font-black text-lg text-blue-400 flex-1 shadow-inner px-6"
                      />
                      <select
                        value={formData.openingBalanceType}
                        onChange={e => setFormData({...formData, openingBalanceType: e.target.value as any})}
                        className="h-14 rounded-2xl bg-slate-900 border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-white px-6 outline-none focus:border-blue-500/50 shadow-2xl appearance-none"
                      >
                        <option value="debit">DEBIT (DR)</option>
                        <option value="credit">CREDIT (CR)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2">Activation Timestamp</Label>
                    <Input 
                      type="date"
                      value={formData.installationDate}
                      onChange={e => setFormData({...formData, installationDate: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 focus:border-blue-500/50 font-black text-[13px] text-white tracking-widest uppercase shadow-inner px-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 pt-12 relative z-10 border-t border-white/5 mt-auto">
              <Button variant="ghost" className="h-16 px-12 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] text-slate-600 hover:text-white transition-all" onClick={() => setShowModal(false)}>Abort Changes</Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="h-16 px-16 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white shadow-2xl shadow-blue-600/40 font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
                {editingSub ? "Commit Sync" : "Deploy Node"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Prompt */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 text-white w-full max-w-lg p-16 rounded-[6rem] shadow-2xl border border-white/5 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.6)]" />
            <div className="h-24 w-24 rounded-[3.5rem] bg-rose-600/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl shadow-rose-600/10 mx-auto mb-10 animate-pulse">
              <Trash2 className="h-12 w-12" />
            </div>
            <h2 className="text-4xl font-black mb-6 uppercase italic tracking-tighter">Terminate Node?</h2>
            <p className="text-slate-600 mb-12 font-black text-[11px] uppercase tracking-[0.3em] leading-loose px-8 italic">
              PERMANENT REGISTRY ERASURE INITIATED. ALL FINANCIAL LOGS AND NETWORK PROVISIONING WILL BE PURGED FROM THE CENTRAL HUB.
            </p>
            <div className="flex flex-col gap-4">
              <Button 
                variant="destructive" 
                className="h-16 rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] bg-rose-600 hover:bg-rose-500 shadow-2xl shadow-rose-600/40 transition-all active:scale-95"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Confirm Eradication
              </Button>
              <Button variant="ghost" className="h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] text-slate-700 hover:text-white transition-all" onClick={() => setConfirmModal(null)}>Abort Protocol</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
