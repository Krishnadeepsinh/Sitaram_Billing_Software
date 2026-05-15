import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Plus, Phone, MapPin, Loader2, Edit2, 
  Trash2, History, FileText, Wifi, ChevronRight,
  Activity, Wallet, X, User, Shield, CreditCard,
  Network, Signal, Globe, ArrowUpRight, Zap, DatabaseZap,
  ShieldCheck, LayoutGrid, ListFilter, Users, Download
} from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBusinessMode } from "@/lib/turso";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useNavigate } from "react-router-dom";

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
          <mark key={i} className="rounded-sm bg-[#6C63FF]/20 px-0.5 font-semibold text-[#6C63FF]">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default function Subscribers() {
  const navigate = useNavigate();
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
        await addSubscriber({
          ...rest,
          openingBalance: finalOpeningBalance,
          status: formData.status || 'active',
          expiryDate: '',
          balance: 0,
          autoBilling: false,
          unpaidMonths: [],
        });
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
      toast.success("Subscriber Deleted");
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
      toast.success(isLegacy ? "Recovery Invoice Created" : "Invoice Generated");
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

  const handleCollectPayment = (sub: any) => {
    navigate(`/payments?subscriberId=${encodeURIComponent(sub.id)}`);
  };

  const handleExportExcel = () => {
    try {
      const exportData = filtered.map(s => {
        const plan = dbPlans.find(p => p.id === s.planId);
        const balance = effectiveBalances[s.id] || 0;
        return {
          'No': s.customerNo || '',
          'Name': s.name,
          'Phone': s.phone,
          'Area / Zone': s.area || 'General',
          [customerIdLabel]: s.customerId,
          'Username': s.customerUsername || '',
          'Password': s.customerPassword || '',
          'Email': s.email || '',
          'Plan Name': plan?.name || 'Unassigned',
          'Plan Monthly Price': plan?.price || 0,
          'Status': (s.status || 'Active').toUpperCase(),
          'Current Balance': balance,
          'Opening Balance': s.openingBalance || 0,
          'Expiry Date': s.expiryDate || 'N/A',
          'Installation Date': s.installationDate || 'N/A',
          'House No': s.houseNo || '',
          'Landmark': s.landmark || '',
          'Auto Billing': s.autoBilling ? 'Enabled' : 'Disabled',
          'Unpaid Months': s.unpaidMonths || 0,
          'System ID': s.id
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
      XLSX.writeFile(wb, `Subscribers_${activeBusinessMode}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel Report Downloaded");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("Failed to export Excel");
    }
  };

  const subPayments = useMemo(() => {
    if (!historySub) return [];
    return payments.filter(p => p.subscriberId === historySub.id)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [historySub, payments]);

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Subscribers
            </h1>
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border animate-in fade-in zoom-in duration-300",
              isCableMode 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            )}>
              {activeBusinessMode} Mode
            </div>
          </div>
          <p className="text-sm text-slate-400">Manage your network nodes and customers</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline"
            className="flex-1 md:flex-none h-10 border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors" 
            onClick={async () => {
              setIsGlobalRefreshing(true);
              try {
                await refreshData();
                toast.success("Data synced");
              } finally {
                setIsGlobalRefreshing(false);
              }
            }}
          >
            <Loader2 className={cn("mr-2 h-4 w-4", isGlobalRefreshing && "animate-spin")} />
            Sync
          </Button>
          <Button 
            variant="outline"
            className="flex-1 md:flex-none h-10 border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
            onClick={handleExportExcel}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none h-10 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Subscriber
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl border border-white/10 bg-slate-900 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID, phone..."
            className="h-10 rounded-lg border-white/10 bg-slate-950 pl-10 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-transparent"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button 
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-md hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select 
            className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            value={statusF}
            onChange={(e: any) => setStatusF(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select 
            className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            value={areaF}
            onChange={(e) => setAreaF(e.target.value)}
          >
            <option value="all">All Areas</option>
            {areas.filter(a => a !== "all").map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select 
            className="h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            value={planF}
            onChange={(e) => setPlanF(e.target.value)}
          >
            <option value="all">All Plans</option>
            {dbPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-white/10 bg-slate-950">
            <Switch 
              id="dues-only" 
              checked={showDuesOnly} 
              onCheckedChange={setShowDuesOnly}
              className="data-[state=checked]:bg-indigo-600"
            />
            <Label htmlFor="dues-only" className="cursor-pointer text-sm text-slate-400 whitespace-nowrap">Overdue Only</Label>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-white/10 bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950">
                <th className="px-4 py-3 font-medium text-slate-400 whitespace-nowrap w-16">No.</th>
                <th className="px-4 py-3 font-medium text-slate-400">Subscriber</th>
                <th className="px-4 py-3 font-medium text-slate-400">{customerIdLabel} / Area</th>
                <th className="px-4 py-3 font-medium text-slate-400">Plan & Balance</th>
                <th className="px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 font-medium text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-slate-500" />
                      <p>No subscribers found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const plan = dbPlans.find(p => p.id === s.planId);
                const balance = effectiveBalances[s.id] || 0;
                
                return (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-medium text-xs">
                        {s.customerNo || '?'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200"><Highlight text={s.name} query={q} /></span>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                          <Phone className="h-3 w-3" />
                          <span>{s.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200"><Highlight text={s.customerId || "N/A"} query={q} /></span>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs">
                          <MapPin className="h-3 w-3" />
                          <span><Highlight text={s.area} query={q} /></span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-semibold",
                            balance >= 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {formatCurrency(balance)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 mt-1">{plan?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge 
                        status={s.status} 
                        isLoading={updatingStatus[s.id]}
                        onClick={async () => {
                          const currentStatus = String(s.status || "").toLowerCase().trim();
                          const newStatus = (currentStatus === 'active') ? 'inactive' : 'active';
                          setUpdatingStatus(prev => ({ ...prev, [s.id]: true }));
                          try {
                            await updateSubscriber(s.id, { status: newStatus });
                          } catch (err: any) {
                            toast.error(err.message || "Failed to update status");
                          } finally {
                            setUpdatingStatus(prev => ({ ...prev, [s.id]: false }));
                          }
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                          onClick={() => handleOpenHistory(s)}
                          title="View Ledger"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleOpenInvoice(s)}
                          title="Generate Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                          onClick={() => handleCollectPayment(s)}
                          title="Collect Payment"
                        >
                          <Wallet className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Subscriber"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => setConfirmModal({ type: 'delete', id: s.id })}
                          title="Delete Subscriber"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-slate-900 p-8 text-center text-slate-400">
            <Users className="h-8 w-8 mx-auto mb-3 text-slate-500" />
            <p>No subscribers found</p>
          </div>
        ) : filtered.map((s) => {
          const plan = dbPlans.find(p => p.id === s.planId);
          const balance = effectiveBalances[s.id] || 0;

          return (
            <div key={s.id} className="rounded-xl border border-white/10 bg-slate-900 p-4 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-medium text-sm">
                    {s.customerNo || '?'}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200 text-base leading-none mb-1.5"><Highlight text={s.name} query={q} /></h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {s.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <StatusBadge 
                  status={s.status} 
                  isLoading={updatingStatus[s.id]}
                  onClick={async () => {
                    const currentStatus = String(s.status || "").toLowerCase().trim();
                    const newStatus = (currentStatus === 'active') ? 'inactive' : 'active';
                    setUpdatingStatus(prev => ({ ...prev, [s.id]: true }));
                    try {
                      await updateSubscriber(s.id, { status: newStatus });
                    } catch (err: any) {
                      toast.error(err.message || "Failed to update");
                    } finally {
                      setUpdatingStatus(prev => ({ ...prev, [s.id]: false }));
                    }
                  }}
                  className="cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-slate-950 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">{customerIdLabel}</span>
                  <span className="text-slate-200 font-medium"><Highlight text={s.customerId || "N/A"} query={q} /></span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">Area</span>
                  <span className="text-slate-200"><Highlight text={s.area} query={q} /></span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">Plan</span>
                  <span className="text-slate-200 truncate block" title={plan?.name}>{plan?.name || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">Balance</span>
                  <span className={cn("font-medium", balance >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10" onClick={() => handleOpenHistory(s)}>
                    <History className="h-4 w-4 mr-1.5" /> Ledger
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleOpenInvoice(s)}>
                    <FileText className="h-4 w-4 mr-1.5" /> Bill
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10" onClick={() => handleCollectPayment(s)}>
                    <Wallet className="h-4 w-4 mr-1.5" /> Collect
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800" onClick={() => handleOpenEdit(s)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => setConfirmModal({ type: 'delete', id: s.id })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Modal (Bottom Sheet on Mobile, Centered on Desktop) */}
      {showHistory && historySub && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="bg-slate-900 w-full md:max-w-2xl max-h-[85vh] rounded-t-2xl md:rounded-xl border border-white/10 relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95">
            <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-white">{historySub.name}</h2>
                <p className="text-sm text-slate-400">Payment History</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200" onClick={() => setShowHistory(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {subPayments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Wallet className="h-10 w-10 mx-auto mb-3 text-slate-500" />
                  <p>No payment records found.</p>
                </div>
              ) : (
                subPayments.map(p => (
                  <div key={p.id} className="p-4 rounded-xl border border-white/10 bg-slate-950 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{formatCurrency(p.amount)}</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">{p.method}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-sm text-slate-200">{formatDate(p.date)}</span>
                      <span className="text-xs text-slate-500 font-mono">{p.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceSub && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvoiceModal(false)} />
          <div className="bg-slate-900 w-full md:max-w-md max-h-[90vh] rounded-t-2xl md:rounded-xl border border-white/10 relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95">
            <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-white">Generate Invoice</h2>
                <p className="text-sm text-slate-400">{invoiceSub.name}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200" onClick={() => setShowInvoiceModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex p-1 bg-slate-950 border border-white/10 rounded-lg">
                <button
                  onClick={() => setBillingType("plan")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-colors",
                    billingType === "plan" ? "bg-slate-800 text-slate-200 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Plan Renewal
                </button>
                <button
                  disabled={!(invoiceSub.openingBalance && Number(invoiceSub.openingBalance) > 0)}
                  onClick={() => setBillingType("legacy")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-30",
                    billingType === "legacy" ? "bg-slate-800 text-slate-200 shadow-sm" : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Legacy Dues
                </button>
              </div>

              {billingType === "plan" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Start Date</Label>
                    <Input
                       type="date"
                       value={rechargeDate}
                       onChange={(e) => setRechargeDate(e.target.value)}
                       className="h-10 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Duration (Months/Cycles)</Label>
                    <select
                      value={planMonths}
                      onChange={(e) => setPlanMonths(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 text-slate-200 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m} {m > 1 ? 'Cycles' : 'Cycle'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Plan</span>
                      <span className="text-slate-200 font-medium">{dbPlans.find(p => p.id === invoiceSub.planId)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Expiry</span>
                      <span className="text-slate-200 font-medium">{formatDate(projectedExpiryDate || "")}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold pt-3 border-t border-white/10">
                      <span className="text-slate-200">Total Amount</span>
                      <span className="text-indigo-400">{formatCurrency((dbPlans.find(p => p.id === invoiceSub.planId)?.price || 0) * planMonths)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Generate an invoice for the outstanding legacy dues recorded during initial setup.
                  </p>
                  <div className="flex justify-between text-base font-semibold pt-3 border-t border-white/10">
                    <span className="text-slate-200">Settlement Amount</span>
                    <span className="text-rose-500">{formatCurrency(invoiceSub.openingBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3 shrink-0 bg-slate-900 md:rounded-b-xl">
              <Button variant="outline" className="flex-1 h-10 border-white/10 hover:bg-slate-800 text-slate-200" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerateInvoice} 
                disabled={isSaving} 
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Subscriber Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-slate-900 w-full md:max-w-2xl max-h-[95vh] rounded-t-2xl md:rounded-xl border border-white/10 relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95">
            <div className="p-5 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-white">{editingSub ? "Edit Subscriber" : "Add Subscriber"}</h2>
                <p className="text-sm text-slate-400">Enter subscriber details</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Name <span className="text-rose-500">*</span></Label>
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Full Name" 
                      className="h-10 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Phone</Label>
                    <Input 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="10-digit number" 
                      className="h-10 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Area / Sector</Label>
                    <Input 
                      value={formData.area}
                      onChange={e => setFormData({...formData, area: e.target.value})}
                      placeholder="Area Name" 
                      className="h-10 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">{customerIdLabel}</Label>
                    <Input 
                      value={formData.customerId}
                      onChange={e => setFormData({...formData, customerId: e.target.value})}
                      placeholder={isCableMode ? "STB / Box Number" : "MAC / Username"} 
                      className="h-10 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Plan / Tier</Label>
                    <select 
                      value={formData.planId}
                      onChange={e => setFormData({...formData, planId: e.target.value})}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 text-slate-200 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                    >
                      {dbPlans.map(p => <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Status</Label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 text-slate-200 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Installation Date</Label>
                    <Input 
                      type="date"
                      value={formData.installationDate}
                      onChange={e => setFormData({...formData, installationDate: e.target.value})}
                      className="h-10 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-400">Opening Balance</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        value={formData.openingBalance || ''}
                        onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}
                        placeholder="0.00" 
                        className="h-10 flex-1 rounded-lg border-white/10 bg-slate-950 text-slate-200 focus-visible:ring-indigo-500"
                      />
                      <select
                        value={formData.openingBalanceType}
                        onChange={e => setFormData({...formData, openingBalanceType: e.target.value as any})}
                        className="h-10 rounded-lg border border-white/10 bg-slate-950 text-slate-200 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="debit">Due (Dr)</option>
                        <option value="credit">Advance (Cr)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3 shrink-0 bg-slate-900 md:rounded-b-xl">
              <Button variant="outline" className="flex-1 h-10 border-white/10 hover:bg-slate-800 text-slate-200" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingSub ? "Save Changes" : "Add Subscriber"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="bg-slate-900 w-full max-w-sm rounded-xl border border-white/10 relative z-10 flex flex-col shadow-2xl p-6 text-center animate-in zoom-in-95">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Delete Subscriber?</h2>
            <p className="text-sm text-slate-400 mb-6">
              This action cannot be undone. All associated invoices and payments will also be permanently deleted.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 h-10 border-white/10 hover:bg-slate-800 text-slate-200" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
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
