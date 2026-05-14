import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Plus, Phone, MapPin, Filter, AlertCircle, Loader2, Edit2, 
  Trash2, History, FileText, Wifi, MoreVertical, ChevronRight, Download,
  Activity, Edit, Wallet
} from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useBusinessMode } from "@/lib/turso";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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

export default function Subscribers() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const customerIdLabel = isCableMode ? "STB Number" : "Customer ID";
  const addressLabel = isCableMode ? "Area" : "Customer Address";
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
  const [showPassword, setShowPassword] = useState(false);
   const [confirmModal, setConfirmModal] = useState<{type: 'delete', id: string} | null>(null);
   const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
   const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceSub, setInvoiceSub] = useState<any>(null);
  const [billingMonth, setBillingMonth] = useState(new Date().getMonth());
  const [billingYear, setBillingYear] = useState(new Date().getFullYear());
  const [rechargeDate, setRechargeDate] = useState(new Date().toISOString().slice(0, 10));
  const [planMonths, setPlanMonths] = useState(1);
  const [endMonth, setEndMonth] = useState(new Date().getMonth());
  const [endYear, setEndYear] = useState(new Date().getFullYear());

  const [includePreviousDue, setIncludePreviousDue] = useState(false);
  const [billingType, setBillingType] = useState<"plan" | "legacy">("plan");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2026, 2027, 2028, 2029];
  const selectedPlanForRecharge = dbPlans.find(p => p.id === invoiceSub?.planId);
  const isValidRechargeDate = /^\d{4}-\d{2}-\d{2}$/.test(rechargeDate) && !Number.isNaN(new Date(`${rechargeDate}T12:00:00`).getTime());
  const projectedExpiryDate = useMemo(() => {
    if (billingType !== "plan" || !isValidRechargeDate || !selectedPlanForRecharge) return "";
    const start = new Date(`${rechargeDate}T12:00:00`);
    start.setDate(start.getDate() + Math.max(1, Number(selectedPlanForRecharge.validityDays || 30) * planMonths) - 1);
    return start.toISOString();
  }, [billingType, isValidRechargeDate, rechargeDate, selectedPlanForRecharge, planMonths]);

  const areas = useMemo(() => ["all", ...new Set(subscribers.map(s => s.area || "Unknown"))], [subscribers]);

  // Compute REAL balance from actual invoice and payment records.
  // This avoids showing orphan "Due" amounts from old subscribers created
  // with balance=-plan.price but no corresponding invoice records.
  const effectiveBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sub of subscribers) {
      const totalInvoiced = invoices
        .filter(i => i.subscriberId === sub.id)
        .reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalPaid = payments
        .filter(p => p.subscriberId === sub.id)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      map[sub.id] = totalPaid - totalInvoiced - Number(sub.openingBalance || 0); // negative = owes money
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
          (s.email || "").toLowerCase().includes(token) ||
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
    setShowPassword(false);
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
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (isSaving) return;

    // Mobile is now optional
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit mobile number or leave blank");
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error("Subscriber name is required");
      return;
    }

    setIsSaving(true);
    const { openingBalanceType, ...rest } = formData;
    const finalOpeningBalance = openingBalanceType === 'credit' 
      ? -Math.abs(formData.openingBalance) 
      : Math.abs(formData.openingBalance);

    const submissionData = {
      ...rest,
      name: rest.name.trim(),
      phone: rest.phone.trim(),
      area: rest.area.trim(),
      customerId: rest.customerId.trim(),
      customerUsername: rest.customerUsername.trim(),
      customerPassword: rest.customerPassword.trim(),
      email: rest.email.trim(),
      openingBalance: finalOpeningBalance,
      expiryDate: editingSub?.expiryDate || ""
    };

    try {
      if (editingSub) {
        await updateSubscriber(editingSub.id, submissionData);
      } else {
        await addSubscriber({
          ...submissionData,
          status: formData.status || 'active',
          balance: 0,
          unpaidMonths: [],
          autoBilling: true,
          expiryDate: submissionData.expiryDate
        });
      }
      await refreshData();
      toast.success(editingSub ? "Subscriber updated" : "Subscriber added successfully");
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save subscriber");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({ type: 'delete', id });
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteSubscriber(id);
    } catch (e) {
      console.error("Failed to delete subscriber", e);
    }
  };

  const [selectedInvoiceMonths, setSelectedInvoiceMonths] = useState<string[]>([]);
  const availableMonthsToSelect = useMemo(() => {
    const list = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const dCopy = new Date(d.getFullYear(), d.getMonth() + i, 1);
      list.push(dCopy.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    return list;
  }, []);

  const handleOpenInvoice = (sub: any) => {
    setInvoiceSub(sub);
    setBillingMonth(new Date().getMonth());
    setBillingYear(new Date().getFullYear());
    setRechargeDate(new Date().toISOString().slice(0, 10));
    setPlanMonths(1);
    setEndMonth(new Date().getMonth());
    setEndYear(new Date().getFullYear());
    setBillingType("plan");
    setShowInvoiceModal(true);
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceSub) return;
    setIsSaving(true);
    try {
      const isLegacy = billingType === "legacy";
      if (!isLegacy && !isValidRechargeDate) {
        toast.error("Please select a valid recharge date");
        return;
      }
      const startDate = rechargeDate ? new Date(`${rechargeDate}T12:00:00`) : new Date();
      await generateInvoice(invoiceSub.id, isLegacy ? 0 : planMonths, false, startDate, isLegacy);
      toast.success(isLegacy ? "Legacy invoice generated" : "Recharge invoice generated");
      setShowInvoiceModal(false);
      setBillingType("plan");
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

  const handleOpenHistory = (sub: any) => {
    setHistorySub(sub);
    setShowHistory(true);
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-black mb-2 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Network Management · Global
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            Active <span className="text-primary italic">Subscribers</span>
          </h1>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            Manage your {activeBusinessMode === "cable" ? "Cable" : "Broadband"} network accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="h-11 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2.5 text-slate-600" 
            onClick={async () => {
              setIsGlobalRefreshing(true);
              try {
                await refreshData();
                toast.success("Database Synchronized");
              } finally {
                setIsGlobalRefreshing(false);
              }
            }}
          >
            <Loader2 className={cn("h-3.5 w-3.5", isGlobalRefreshing && "animate-spin")} />
            Sync
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2.5"
          >
            <Plus className="h-4 w-4" /> Add Subscriber
          </Button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-all duration-300" />
            <Input
              placeholder={`Search name, phone, area, or ${customerIdLabel}...`}
              className="pl-10 bg-slate-50 border-transparent rounded-xl h-11 focus:bg-white focus:ring-primary/10 transition-all text-[11px] font-bold placeholder:text-slate-400"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button 
                onClick={() => setQ("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <select 
                className="bg-transparent border-none rounded-lg h-9 px-3 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-all min-w-[110px] cursor-pointer text-slate-600"
                value={statusF}
                onChange={(e: any) => setStatusF(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="w-px h-3 bg-slate-200" />
              <select 
                className="bg-transparent border-none rounded-lg h-9 px-3 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-all min-w-[110px] cursor-pointer text-slate-600"
                value={areaF}
                onChange={(e) => setAreaF(e.target.value)}
              >
                <option value="all">All Areas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="w-px h-3 bg-slate-200" />
              <select 
                className="bg-transparent border-none rounded-lg h-9 px-3 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-0 transition-all min-w-[110px] cursor-pointer text-slate-600"
                value={planF}
                onChange={(e) => setPlanF(e.target.value)}
              >
                <option value="all">All Plans</option>
                {dbPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-4 h-11 rounded-xl border border-slate-100">
              <Switch 
                id="dues-only" 
                checked={showDuesOnly} 
                onCheckedChange={setShowDuesOnly}
                className="scale-75 data-[state=checked]:bg-rose-500 shadow-sm"
              />
              <Label htmlFor="dues-only" className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 cursor-pointer select-none">Overdue Only</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Subscriber</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{customerIdLabel}</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Plan & Price</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Balance</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-5 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => {
                const plan = dbPlans.find(p => p.id === s.planId);
                const balance = effectiveBalances[s.id] || 0;
                
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-9 w-9 rounded-xl flex items-center justify-center font-display font-black text-[11px] text-white shadow-sm transition-transform group-hover:scale-105",
                          balance >= 0 ? "bg-emerald-600" : "bg-rose-600"
                        )}>
                          {s.customerNo || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight text-slate-900"><Highlight text={s.name} query={q} /></p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3" /> {s.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary"><Highlight text={s.customerId || "N/A"} query={q} /></span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-2.5 w-2.5" /> <Highlight text={s.area} query={q} />
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Wifi className="h-3 w-3 text-primary" />
                          {plan?.name || "No Plan"}
                        </p>
                        <p className="text-[10px] font-black text-slate-400">{formatCurrency(plan?.price || 0)}/mo</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative group/balance">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono-num font-black text-xs border transition-all",
                          balance >= 0 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" 
                            : "bg-rose-50 text-rose-600 border-rose-100 shadow-sm"
                        )}>
                          {formatCurrency(balance)}
                        </div>
                        
                        {/* Statement Analysis Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 invisible group-hover/balance:visible opacity-0 group-hover/balance:opacity-100 transition-all z-50 pointer-events-none">
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl min-w-[220px]">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                              <div className="h-5 w-1.5 bg-emerald-500 rounded-full" />
                              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Statement Analysis</p>
                            </div>
                            <div className="space-y-3 font-mono-num text-[11px]">
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-slate-500 font-bold uppercase tracking-tighter">Invoiced Total</span>
                                <span className="text-rose-600 font-black bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">-{formatCurrency(invoices.filter(inv => inv.subscriberId === s.id).reduce((sum, inv) => sum + Number(inv.amount || 0), 0))}</span>
                              </div>
                              <div className="flex justify-between items-center gap-6">
                                <span className="text-slate-500 font-bold uppercase tracking-tighter">Opening Balance</span>
                                <span className={Number(s.openingBalance || 0) >= 0 ? "text-rose-600 font-black bg-rose-50 px-2 py-1 rounded-lg border border-rose-100" : "text-emerald-600 font-black bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"}>
                                  {Number(s.openingBalance || 0) >= 0 ? "-" : "+"}{formatCurrency(Math.abs(Number(s.openingBalance || 0)))}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-6 pb-3 border-b border-slate-100 border-dashed">
                                <span className="text-slate-500 font-bold uppercase tracking-tighter">Total Received</span>
                                <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">+{formatCurrency(payments.filter(p => p.subscriberId === s.id).reduce((sum, p) => sum + Number(p.amount || 0), 0))}</span>
                              </div>
                              <div className="flex justify-between items-center gap-6 pt-1">
                                <span className="text-slate-900 font-black uppercase text-[10px] tracking-[0.15em]">Net Balance</span>
                                <div className={`px-3 py-2 rounded-xl border-2 ${(effectiveBalances[s.id] || 0) >= 0 ? "bg-emerald-500 text-white border-emerald-400" : "bg-rose-600 text-white border-rose-500"}`}>
                                  <span className="font-black text-xs">{formatCurrency(effectiveBalances[s.id] || 0)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="absolute -bottom-1.5 left-8 w-4 h-4 bg-white rotate-45 border-r border-b border-slate-200" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
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
                            toast.error("Failed to update status");
                          } finally {
                            setUpdatingStatus(prev => ({ ...prev, [s.id]: false }));
                          }
                        }}
                        className="shadow-sm"
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                          onClick={() => handleOpenHistory(s)}
                          title="Payment History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                          onClick={() => handleOpenInvoice(s)}
                          title="Generate Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Account"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                          onClick={() => handleDelete(s.id)}
                          title="Delete Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm italic">
                    No subscribers found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS SECTION */}
      {showHistory && historySub && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-4xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black">{historySub.name}</h2>
                <p className="text-sm text-muted-foreground font-medium">Payment & Billing History</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowHistory(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              <div className="space-y-4">
                {subPayments.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-secondary/20 rounded-3xl border-2 border-dashed border-border/40">
                    <History className="h-12 w-12 mb-3 opacity-20" />
                    <p className="font-bold">No payment history found</p>
                  </div>
                ) : (
                  subPayments.map(p => (
                    <div key={p.id} className="p-5 rounded-2xl border border-border/40 bg-secondary/20 flex items-center justify-between hover:bg-secondary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">₹{p.amount}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {p.method}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Receipt</p>
                        <p className="text-xs font-mono font-bold">{p.id}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && invoiceSub && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Generate Invoice</h2>
                <p className="text-sm text-muted-foreground font-medium">{invoiceSub.name}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 p-1 bg-secondary/30 rounded-2xl border border-border/10">
                <button
                  type="button"
                  onClick={() => setBillingType("plan")}
                  className={`flex items-center justify-center gap-2 h-11 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest ${
                    billingType === "plan" 
                      ? "bg-background text-primary shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Wifi className="h-4 w-4" /> Plan Recharge
                </button>
                <button
                  type="button"
                  disabled={!(invoiceSub.openingBalance && Number(invoiceSub.openingBalance) > 0)}
                  onClick={() => setBillingType("legacy")}
                  className={`flex items-center justify-center gap-2 h-11 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-30 disabled:cursor-not-allowed ${
                    billingType === "legacy" 
                      ? "bg-amber-100 text-amber-700 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <History className="h-4 w-4" /> Legacy Due
                </button>
              </div>

              {billingType === "plan" ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Start Date</Label>
                      <Input
                        type="date"
                        value={rechargeDate}
                        onChange={(e) => setRechargeDate(e.target.value)}
                        className="h-12 rounded-2xl border-border/40 bg-secondary/30 font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Months</Label>
                      <select
                        value={planMonths}
                        onChange={(e) => setPlanMonths(Number(e.target.value))}
                        className="h-12 w-full rounded-2xl border border-border/40 bg-secondary/30 font-black px-4 appearance-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                          <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="p-5 rounded-[1.5rem] bg-secondary/20 border border-border/40 space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Selected Plan</span>
                      <span className="text-foreground">{dbPlans.find(p => p.id === invoiceSub.planId)?.name.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Start Date</span>
                      <span className="text-foreground">{formatDate(rechargeDate)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Expiry After</span>
                      <span className="text-foreground">{formatDate(projectedExpiryDate || "")}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-foreground pt-3 border-t border-border/10">
                      <span>Total Amount</span>
                      <span className="text-primary">{formatCurrency((dbPlans.find(p => p.id === invoiceSub.planId)?.price || 0) * planMonths)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-[1.5rem] bg-amber-50 border border-amber-100 space-y-4">
                  <div className="flex items-center gap-3 text-amber-900 font-black text-xs uppercase tracking-widest">
                    <AlertCircle className="h-5 w-5" /> Legacy Due Billing
                  </div>
                  <p className="text-xs font-medium text-amber-700/80 leading-relaxed">
                    This will formalize the opening balance debt into a trackable invoice.
                  </p>
                  <div className="flex justify-between text-xl font-black text-amber-900 pt-2 border-t border-amber-200">
                    <span>Total Due</span>
                    <span>{formatCurrency(invoiceSub.openingBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-10">
              <Button variant="secondary" className="flex-1 h-12 rounded-2xl font-bold" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerateInvoice} 
                disabled={isSaving} 
                className="flex-1 h-12 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 font-black uppercase tracking-widest"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <FileText className="h-5 w-5 mr-2" />}
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card w-full max-w-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 my-8">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  {editingSub ? <Edit className="h-7 w-7" /> : <Plus className="h-7 w-7" />}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{editingSub ? "Edit Subscriber" : "New Account"}</h2>
                  <p className="text-sm text-muted-foreground font-medium">Configure customer profile and services</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary" onClick={() => setShowModal(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-10">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Customer Info</h3>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input 
                    id="name"
                    placeholder="Enter full name" 
                    className="h-12 rounded-2xl bg-secondary/30 border-border/40 focus:ring-primary/20 font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile (Optional)</Label>
                  <Input 
                    id="phone"
                    placeholder="10-digit mobile" 
                    className="h-12 rounded-2xl bg-secondary/30 border-border/40 focus:ring-primary/20 font-mono-num font-bold"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Village / Area</Label>
                  <Input 
                    id="area"
                    placeholder="Area name" 
                    className="h-12 rounded-2xl bg-secondary/30 border-border/40 focus:ring-primary/20 font-bold"
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Service Plan</h3>
                <div className="space-y-2">
                  <Label htmlFor="customerId" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Service ID / MAC (Optional)</Label>
                  <Input 
                    id="customerId"
                    placeholder="Unique ID" 
                    className="h-12 rounded-2xl bg-secondary/30 border-border/40 focus:ring-primary/20 font-mono-num uppercase font-bold"
                    value={formData.customerId}
                    onChange={e => setFormData({...formData, customerId: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Plan Selection</Label>
                  <select 
                    id="plan"
                    className="w-full h-12 rounded-2xl bg-secondary/30 border border-border/40 px-4 text-sm font-black focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                    value={formData.planId}
                    onChange={e => setFormData({...formData, planId: e.target.value})}
                  >
                    {dbPlans.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} — ₹{p.price}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Opening Bal</Label>
                    <Input 
                      type="number"
                      placeholder="0.00"
                      className="h-12 rounded-2xl bg-secondary/30 border-border/40 font-mono-num font-bold"
                      value={formData.openingBalance}
                      onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Type</Label>
                    <select
                      className="w-full h-12 rounded-2xl bg-secondary/30 border border-border/40 px-3 text-[10px] font-black uppercase tracking-tighter outline-none focus:ring-2 focus:ring-primary/20"
                      value={formData.openingBalanceType}
                      onChange={e => setFormData({...formData, openingBalanceType: e.target.value as any})}
                    >
                      <option value="debit">DEBIT (+)</option>
                      <option value="credit">CREDIT (-)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mb-10 pt-8 border-t border-border/10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2">Network Credentials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
                    <Input 
                      placeholder="PPPoE User"
                      className="h-11 rounded-xl bg-secondary/20 border-border/40 font-bold"
                      value={formData.customerUsername}
                      onChange={e => setFormData({...formData, customerUsername: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
                    <Input 
                      placeholder="Password"
                      className="h-11 rounded-xl bg-secondary/20 border-border/40 font-bold"
                      value={formData.customerPassword}
                      onChange={e => setFormData({...formData, customerPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2">Account Dates</h3>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Installation Date</Label>
                  <Input 
                    type="date"
                    className="h-11 rounded-xl bg-secondary/20 border-border/40 font-bold"
                    value={formData.installationDate}
                    onChange={e => setFormData({...formData, installationDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest transition-all"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 rounded-2xl bg-gradient-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
                {editingSub ? "Save Changes" : "Create Account"}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white text-black w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2">Delete Subscriber</h2>
            <p className="text-slate-600 mb-6 font-medium">
              Are you sure you want to delete this subscriber? All associated data will be removed. This action is irreversible.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                className="rounded-xl"
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

