import { useState, useMemo } from "react";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Phone, MapPin, Filter, AlertCircle, Loader2, Edit2, Trash2, History, FileText, Wifi } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
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
  const [statusF, setStatusF] = useState<"all" | "active" | "expired">("all");
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
          (s.name || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (s.code || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (s.phone || "").includes(token) ||
          (s.customerId || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (s.customerUsername || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (s.email || "").toLowerCase().replace(/\s+/g, ' ').includes(token) ||
          (s.area || "").toLowerCase().replace(/\s+/g, ' ').includes(token)
        );
      });
      
      const matchStatus = statusF === "all" || s.status === statusF;
      const matchArea = areaF === "all" || s.area === areaF;
      const matchPlan = planF === "all" || s.planId === planF;
      // Use effectiveBalance (invoice-based) not stale DB balance
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

    const trimmedPhone = formData.phone.trim();
    if (!/^\d{10}$/.test(trimmedPhone)) {
      toast.error("Customer mobile must be exactly 10 digits.");
      return;
    }

    if (!formData.planId) {
      toast.error("Please select a plan.");
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
      phone: trimmedPhone,
      area: rest.area.trim(),
      customerId: rest.customerId.trim(),
      customerUsername: rest.customerUsername.trim(),
      customerPassword: rest.customerPassword.trim(),
      email: rest.email.trim(),
      openingBalance: finalOpeningBalance,
      // Installation date is only the setup date. Expiry is controlled by recharge billing.
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
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Subscriber Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} of {subscribers.length} total subscribers
          </p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Subscriber
        </Button>
      </div>

      {showHistory && historySub && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">Payment History</h2>
                <p className="text-xs text-muted-foreground">Transactions for {historySub.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>✕</Button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
              {subPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">{p.id}</p>
                      <p className="text-sm font-medium">{formatDate(p.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num font-bold text-success">+{formatCurrency(p.amount)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{p.method}</p>
                  </div>
                </div>
              ))}
              {subPayments.length === 0 && (
                <div className="py-12 text-center text-muted-foreground italic text-sm">
                  No payment records found for this subscriber.
                </div>
              )}
            </div>
            <div className="p-4 bg-secondary/20 border-t border-border/40 flex gap-3">
              <Button className="flex-1 rounded-xl" variant="outline" onClick={() => setShowHistory(false)}>Close Profile</Button>
              <Button className="flex-1 bg-primary text-primary-foreground rounded-xl" onClick={() => { setShowHistory(false); handleOpenEdit(historySub); }}>Edit Details</Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="glass-card w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border/50 shrink-0">
              <h2 className="text-xl font-bold">{editingSub ? 'Edit Subscriber' : 'Add New Subscriber'}</h2>
              {editingSub && editingSub.customerNo && (
                <span className="text-xs font-black text-primary/60 bg-primary/5 px-2 py-1 rounded-md">
                  #{String(editingSub.customerNo).padStart(3, '0')}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              <div className="flex flex-col gap-5 sm:grid sm:grid-cols-2 sm:gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Name</label>
                  <Input 
                    className="h-11 sm:h-10 text-base sm:text-sm"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Full name of customer" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Mobile <span className="lowercase normal-case font-normal text-slate-400 ml-1">(optional)</span></label>
                  <Input 
                    className="h-11 sm:h-10 text-base sm:text-sm"
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="10-digit mobile number" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{customerIdLabel} <span className="lowercase normal-case font-normal text-slate-400 ml-1">(optional)</span></label>
                  <Input 
                    className="h-11 sm:h-10 text-base sm:text-sm"
                    value={formData.customerId} 
                    onChange={e => setFormData({...formData, customerId: e.target.value})} 
                    placeholder={customerIdLabel} 
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{addressLabel}</label>
                  <Input 
                    className="h-11 sm:h-10 text-base sm:text-sm"
                    value={formData.area} 
                    onChange={e => setFormData({...formData, area: e.target.value})} 
                    placeholder={isCableMode ? "Select or type area" : "Full customer address"} 
                    list="areas-list" 
                  />
                  <datalist id="areas-list">
                    {areas.filter(a => a !== 'all').map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
                {!isCableMode && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block tracking-wider">Username</label>
                      <Input 
                        className="h-11 sm:h-10 text-base sm:text-sm"
                        value={formData.customerUsername} 
                        onChange={e => setFormData({...formData, customerUsername: e.target.value})} 
                        placeholder="PPPoE / customer username" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block tracking-wider">Password</label>
                      <div className="space-y-2">
                        <Input
                          className="h-11 sm:h-10 text-base sm:text-sm"
                          type={showPassword ? "text" : "password"}
                          value={formData.customerPassword}
                          onChange={e => setFormData({...formData, customerPassword: e.target.value})}
                          placeholder="Connection password"
                        />
                        <label className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold">
                          <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                            className="h-4 w-4 rounded border-border"
                          />
                          Show password
                        </label>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 block tracking-wider">Customer Email</label>
                      <Input 
                        className="h-11 sm:h-10 text-base sm:text-sm"
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="customer@example.com" 
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Installation Date</label>
                  <Input 
                    className="h-11 sm:h-10 text-base sm:text-sm"
                    type="date" 
                    value={formData.installationDate} 
                    onChange={e => setFormData({...formData, installationDate: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Plan</label>
                  <select 
                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 outline-none text-sm h-11 sm:h-10"
                    value={formData.planId}
                    onChange={e => setFormData({...formData, planId: e.target.value})}
                  >
                    {dbPlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({isCableMode ? `${p.speedMbps} Channels` : `${p.speedMbps} Mbps`}, {formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed italic">
                  Note: Expiry date is automatically calculated during bill generation based on the plan's validity days.
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Opening Balance</label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      className="flex-1"
                      value={formData.openingBalance} 
                      onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} 
                      placeholder="Amount..." 
                    />
                    <select 
                      className="w-32 bg-secondary/50 border border-border rounded-lg px-2 outline-none text-xs font-bold"
                      value={formData.openingBalanceType}
                      onChange={e => setFormData({...formData, openingBalanceType: e.target.value as any})}
                    >
                      <option value="debit">DEBIT (DEBT)</option>
                      <option value="credit">CREDIT (ADVANCE)</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account Status</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, status: 'active'})}
                      className={`flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all border ${String(formData.status).toLowerCase() === 'active' ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-secondary border-border/40 text-muted-foreground'}`}
                    >
                      Active
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, status: 'expired'})}
                      className={`flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all border ${String(formData.status).toLowerCase() === 'expired' ? 'bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-200' : 'bg-secondary border-border/40 text-muted-foreground'}`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-border/50 bg-background/80 flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                disabled={isSaving}
                className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl" 
                onClick={handleSave}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Subscriber"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder={`Search name, code, phone, or ${customerIdLabel}...`} 
              className="pl-9 pr-9 bg-secondary/50 border-border/60" 
            />
            {q && (
              <button 
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showDuesOnly ? "destructive" : "outline"} 
              size="sm" 
              onClick={() => setShowDuesOnly(!showDuesOnly)}
              className={showDuesOnly ? "bg-destructive text-destructive-foreground font-medium" : "border-border/60"}
            >
              <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
              Pending Dues
            </Button>
            <Button variant="outline" size="sm" className="border-border/60">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center text-[11px] font-medium uppercase tracking-wider">
          <span className="text-muted-foreground mr-1">Status:</span>
          {(["all", "active", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusF(f)}
              className={`px-3 py-1 rounded-full border transition-colors ${
                statusF === f 
                  ? "bg-primary/20 border-primary text-primary" 
                  : "bg-secondary/50 border-border/60 text-muted-foreground hover:border-border"
              }`}
            >
              {f}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-border/60 mx-2" />
          
          <span className="text-muted-foreground mr-1">{isCableMode ? "Area" : "Address"}:</span>
          <select 
            value={areaF} 
            onChange={(e) => setAreaF(e.target.value)}
            className="bg-secondary/50 border border-border/60 rounded-full px-3 py-1 outline-none text-foreground cursor-pointer"
          >
            {areas.map(a => <option key={a} value={a}>{a === 'all' ? (isCableMode ? 'All Areas' : 'All Addresses') : a}</option>)}
          </select>

          <div className="h-4 w-[1px] bg-border/60 mx-2" />

          <span className="text-muted-foreground mr-1">Plan:</span>
          <select 
            value={planF} 
            onChange={(e) => setPlanF(e.target.value)}
            className="bg-secondary/50 border border-border/60 rounded-full px-3 py-1 outline-none text-foreground cursor-pointer"
          >
            <option value="all">All Plans</option>
            {dbPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border/60">
                <th className="px-4 py-4 font-bold w-20">No.</th>
                <th className="px-4 py-4 font-bold">Subscriber</th>
                <th className="px-4 py-4 font-bold">Contact & {isCableMode ? "Area" : "Address"}</th>
                <th className="px-4 py-4 font-bold">Plan</th>
                <th className="px-4 py-4 font-bold">Balance</th>
                <th className="px-4 py-4 font-bold">Status</th>
                <th className="px-4 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((s) => {
                const plan = dbPlans.find(p => p.id === s.planId);
                return (
                  <tr key={s.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-4">
                      <span className="text-xs font-black text-primary/60 bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                        #{String(s.customerNo || 0).padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          <Highlight text={s.name || 'Unknown'} query={q} />
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono-num mt-0.5">
                          {customerIdLabel}: <Highlight text={s.customerId || 'N/A'} query={q} />
                        </span>
                        {!isCableMode && s.customerUsername && (
                          <span className="text-[10px] text-muted-foreground font-mono-num mt-0.5">
                            User: <Highlight text={s.customerUsername} query={q} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" /> <Highlight text={s.phone || ""} query={q} />
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3 w-3" /> <Highlight text={s.area || ""} query={q} />
                        </div>
                        {!isCableMode && s.email && (
                          <div className="text-[10px] text-muted-foreground">
                            <Highlight text={s.email} query={q} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">
                          {plan?.name || 'No Plan'} 
                          {plan && <span className="text-[10px] ml-1 text-muted-foreground font-normal">({isCableMode ? `${plan.speedMbps} Channels` : `${plan.speedMbps} Mbps`}, {formatCurrency(plan.price)})</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Expires: {formatDate(s.expiryDate)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                        <div className="flex flex-col relative group/bal">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono-num font-bold text-sm ${(effectiveBalances[s.id] || 0) < 0 ? 'text-destructive' : 'text-success'}`}>
                              {formatCurrency(Math.abs(effectiveBalances[s.id] || 0))}
                              <span className="text-[10px] ml-1 font-normal opacity-70">
                                {(effectiveBalances[s.id] || 0) < 0 ? 'Due' : 'Credit'}
                              </span>
                            </span>
                            <div className="h-3.5 w-3.5 rounded-full bg-secondary flex items-center justify-center cursor-help group-hover/bal:bg-primary/20 transition-colors">
                              <AlertCircle className="h-2 w-2 text-muted-foreground" />
                            </div>

                            {/* Balance Math Breakdown Popup */}
                            <div className="absolute left-0 bottom-full mb-3 hidden group-hover/bal:block z-[100] animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <div className="bg-slate-950/95 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/10 min-w-[280px]">
                                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                                  <div className="h-5 w-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Statement Analysis</p>
                                </div>
                                <div className="space-y-3 font-mono-num text-[11px]">
                                  <div className="flex justify-between items-center gap-6">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Invoiced Total</span>
                                    <span className="text-rose-400 font-black bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">-{formatCurrency(invoices.filter(inv => inv.subscriberId === s.id).reduce((sum, inv) => sum + Number(inv.amount || 0), 0))}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-6">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Opening Balance</span>
                                    <span className={Number(s.openingBalance || 0) >= 0 ? "text-rose-400 font-black bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20" : "text-emerald-400 font-black bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"}>
                                      {Number(s.openingBalance || 0) >= 0 ? "-" : "+"}{formatCurrency(Math.abs(Number(s.openingBalance || 0)))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-6 pb-3 border-b border-white/5 border-dashed">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Total Received</span>
                                    <span className="text-emerald-400 font-black bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">+{formatCurrency(payments.filter(p => p.subscriberId === s.id).reduce((sum, p) => sum + Number(p.amount || 0), 0))}</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-6 pt-1">
                                    <span className="text-white font-black uppercase text-[10px] tracking-[0.15em]">Net Ledger Balance</span>
                                    <div className={`px-3 py-2 rounded-xl border-2 ${(effectiveBalances[s.id] || 0) >= 0 ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-rose-600 text-white border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]"}`}>
                                      <span className="font-black text-xs">{formatCurrency(effectiveBalances[s.id] || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Arrow */}
                                <div className="absolute -bottom-1.5 left-8 w-4 h-4 bg-slate-950/95 rotate-45 border-r border-b border-white/10" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col mt-0.5">
                            {(() => {
                              const openingBal = Number(s.openingBalance || 0);
                              const balance = effectiveBalances[s.id] || 0;
                              const unpaidInvoices = invoices
                                .filter(inv => inv.subscriberId === s.id && inv.status !== 'paid')
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              const plan = dbPlans.find(p => p.id === s.planId);
  
                              return (
                                <>
                                  {openingBal !== 0 && (
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">
                                      {openingBal > 0 ? `Prev. Year Billing: ${formatCurrency(openingBal)} (Due)` : `Prev. Year Billing: ${formatCurrency(Math.abs(openingBal))} (Adv)`}
                                    </span>
                                  )}
                                  
                                  {unpaidInvoices.length > 0 && balance < -0.01 && (() => {
                                    const legacyInvoices = unpaidInvoices.filter(inv => inv.type === 'legacy');
                                    const planInvoices = unpaidInvoices.filter(inv => inv.type !== 'legacy');
                                    
                                    let legacyStr = "";
                                    if (legacyInvoices.length > 0) {
                                      legacyStr = "Prev. Year Billing";
                                    }
  
                                    let rangeStr = "";
                                    if (planInvoices.length > 0) {
                                      const allMonths: Date[] = [];
                                      planInvoices.forEach(inv => {
                                        const price = plan && plan.price > 0 ? plan.price : 200;
                                        const num = Math.max(1, Math.round(Number(inv.amount) / price));
                                        for (let i = 0; i < num; i++) {
                                          const d = new Date(inv.date);
                                          d.setMonth(d.getMonth() + i);
                                          allMonths.push(d);
                                        }
                                      });
  
                                      rangeStr = formatMonthRanges(allMonths);
                                    }
  
                                    return (
                                      <span className="text-[9px] text-destructive/80 font-black uppercase tracking-tighter">
                                        {legacyStr && rangeStr ? `Due: ${legacyStr} + ${rangeStr}` : `Due: ${legacyStr}${rangeStr}`}
                                      </span>
                                    );
                                  })()}
  
                                  {unpaidInvoices.length === 0 && (balance + openingBal) < -0.01 && (
                                    <span className="text-[9px] text-destructive/70 italic font-medium">
                                      Carry-forward: {formatCurrency(Math.abs(balance + openingBal))}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge 
                        status={s.status} 
                        onClick={() => updateSubscriber(s.id, { status: String(s.status).toLowerCase() === 'active' ? 'expired' : 'active' })}
                        className="shadow-sm"
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleOpenHistory(s)} title="History">
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-100 text-emerald-600 transition-all" onClick={() => handleOpenInvoice(s)} title="Generate Invoice">
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleOpenEdit(s)} title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => handleDelete(s.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm italic">
                    No subscribers found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvoiceModal && invoiceSub && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Generate Invoice</h2>
                <p className="text-sm text-muted-foreground">{invoiceSub.name}</p>
              </div>
            </div>
            
            <div className="space-y-6 mb-8">
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingType("plan")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    billingType === "plan" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border bg-transparent text-muted-foreground hover:border-slate-300"
                  }`}
                >
                  <Wifi className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Current Plan</span>
                </button>
                <button
                  type="button"
                  disabled={!(invoiceSub.openingBalance && Number(invoiceSub.openingBalance) > 0)}
                  onClick={() => setBillingType("legacy")}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    billingType === "legacy" 
                      ? "border-amber-600 bg-amber-50 text-amber-900" 
                      : "border-border bg-transparent text-muted-foreground hover:border-slate-300"
                  }`}
                >
                  <History className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Legacy Due</span>
                </button>
              </div>

              {billingType === "legacy" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Legacy Due Selected
                  </div>
                  <p className="text-[10px] text-amber-700">
                    This will generate a separate invoice for the opening balance of ₹{invoiceSub.openingBalance || 0}.
                  </p>
                </div>
              )}

              {billingType === "plan" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Recharge Date</label>
                    <Input
                      type="date"
                      value={rechargeDate}
                      onChange={(e) => setRechargeDate(e.target.value)}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 font-bold text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">No. Of Months</label>
                    <Input
                      type="number"
                      min={1}
                      value={planMonths}
                      onChange={(e) => setPlanMonths(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 font-bold text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                {billingType === "plan" ? (
                  <>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Recharge Date</span>
                      <span className="font-mono-num font-bold">{isValidRechargeDate ? formatDate(`${rechargeDate}T12:00:00`) : "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Plan Price</span>
                      <span className="font-mono-num font-bold">{formatCurrency(dbPlans.find(p => p.id === invoiceSub.planId)?.price || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Plan Duration</span>
                      <span className="font-mono-num font-bold">{(selectedPlanForRecharge?.validityDays || 30) * planMonths} Days</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Months / Cycles</span>
                      <span className="font-mono-num font-bold">{planMonths}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">Expiry Date</span>
                      <span className="font-mono-num font-bold">{formatDate(projectedExpiryDate || "")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm mb-1 text-amber-600 font-bold">
                    <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Legacy Due</span>
                    <span className="font-mono-num">{formatCurrency(invoiceSub.openingBalance)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg mt-2 pt-2 border-t border-border/50">
                  <span className="font-bold">Total Invoice Amount</span>
                  <span className="font-mono-num font-black text-primary">
                    {formatCurrency(
                      billingType === "plan" 
                        ? (dbPlans.find(p => p.id === invoiceSub.planId)?.price || 0) * planMonths
                        : Number(invoiceSub.openingBalance || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" className="rounded-xl font-bold" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
              <Button onClick={handleGenerateInvoice} disabled={isSaving} className="bg-emerald-500 text-white hover:bg-emerald-600">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate Now
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

