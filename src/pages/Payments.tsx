import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { 
  Plus, Search, Receipt, Wallet, Banknote, Filter, Loader2, 
  Trash2, Download, Eye, X, Activity, Share2, Smartphone, 
  AlertCircle, Check, Smartphone as PhoneIcon, ShieldCheck,
  TrendingUp, DatabaseZap, MapPin, Calendar, History,
  ArrowUpRight, Network, Signal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBilling } from "@/context/BillingContext";
import { getInvoiceServiceDates } from "@/components/invoice/invoicePreviewUtils";
import { toast } from "sonner";
import { getBrandSettings } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { useBusinessMode } from "@/lib/turso";

export default function Payments() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const customerIdLabel = isCableMode ? "STB" : "CID";
  const { payments, subscribers, plans, invoices, recordPayment, deletePayment, isLoading, companySettings, refreshData } = useBilling();
  const brand = getBrandSettings(companySettings);
  const [q, setQ] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      setScale(newScale);
    };
    if (isReceiptOpen) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isReceiptOpen]);

  const loadHtml2Pdf = async () => (await import("html2pdf.js")).default;

  const getPaymentItems = (payment: any) => {
    if (!payment) return [];
    const sub = subscribers.find(s => s.id === payment.subscriberId);
    const plan = plans.find(p => p.id === sub?.planId);
    const chronoInvoices = invoices.filter(inv => inv.subscriberId === payment.subscriberId)
      .sort((a, b) => {
        const typeA = a.type === 'legacy' ? 0 : 1;
        const typeB = b.type === 'legacy' ? 0 : 1;
        if (typeA !== typeB) return typeA - typeB;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    const subPayments = payments.filter(p => p.subscriberId === payment.subscriberId);
    const prevTotalPaid = subPayments
      .filter(p => new Date(p.date).getTime() < new Date(payment.date).getTime() || 
                  (new Date(p.date).getTime() === new Date(payment.date).getTime() && p.id < payment.id))
      .reduce((s, p) => s + Number(p.amount) + (Number(p.discount) || 0), 0);

    let historyLeft = prevTotalPaid;
    const openingBal = Number(sub?.openingBalance || 0);
    const alreadyCoveredOpening = Math.max(0, Math.min(openingBal, historyLeft));
    historyLeft -= alreadyCoveredOpening;
    const remainingOpeningDue = openingBal - alreadyCoveredOpening;

    const invoiceRemainingDues = new Map<string, { remaining: number, coveredByHistory: number }>();
    for (const inv of chronoInvoices) {
      const invAmount = Number(inv.amount || 0);
      const coveredByHistory = Math.max(0, Math.min(invAmount, historyLeft));
      historyLeft -= coveredByHistory;
      invoiceRemainingDues.set(inv.id, { remaining: invAmount - coveredByHistory, coveredByHistory });
    }

    const priorityInvoices = [...chronoInvoices].sort((a, b) => {
      if (payment.invoiceId === a.id) return -1;
      if (payment.invoiceId === b.id) return 1;
      return 0;
    });

    const items: any[] = [];
    let remainingCurrentPayment = Number(payment.amount) + (Number(payment.discount) || 0);

    if (remainingOpeningDue > 0 && remainingCurrentPayment > 0) {
      const amt = Math.min(remainingOpeningDue, remainingCurrentPayment);
      items.push({ desc: "Previous Dues / Opening Balance", subDesc: "Outstanding balance", date: "\u2014", qty: "\u2014", total: amt });
      remainingCurrentPayment -= amt;
    }

    for (const inv of priorityInvoices) {
      const dues = invoiceRemainingDues.get(inv.id);
      if (!dues || dues.remaining <= 0 || remainingCurrentPayment <= 0) continue;
      const amt = Math.min(dues.remaining, remainingCurrentPayment);
      if (inv.type === 'legacy') {
        items.push({ desc: "Previous Year Billing", subDesc: "Historical dues", date: formatDate(inv.date), qty: "\u2014", total: amt });
      } else {
        const invDate = new Date(inv.date);
        invDate.setHours(12, 0, 0, 0);
        items.push({ 
          desc: `Subscription (${inv.billingPeriod || invDate.toLocaleString('default', { month: 'short', year: '2-digit' }).toUpperCase()})`, 
          subDesc: `${plan?.name || 'Service'} Plan`, 
          date: formatDate(inv.date), 
          qty: "1", 
          total: amt 
        });
      }
      remainingCurrentPayment -= amt;
    }

    if (remainingCurrentPayment >= 0.1) {
      items.push({ desc: "Credit / Advance Received", subDesc: "Account balance", date: formatDate(payment.date), qty: "\u2014", total: remainingCurrentPayment });
    }
    return items;
  };

  const selectedPaymentItems = useMemo(() => getPaymentItems(selectedPayment), [selectedPayment, subscribers, plans, invoices, payments]);
  const getLinkedInvoice = (payment: any) => {
    if (!payment) return null;
    if (payment.invoiceId) return invoices.find(inv => inv.id === payment.invoiceId) || null;
    return invoices.filter(inv => inv.subscriberId === payment.subscriberId).sort((a,b) => Math.abs(new Date(a.date).getTime() - new Date(payment.date).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(payment.date).getTime()))[0] || null;
  };

  const selectedPaymentServiceDates = useMemo(() => {
    if (!selectedPayment) return { rechargeDate: "", expiryDate: "" };
    const sub = subscribers.find(s => s.id === selectedPayment.subscriberId);
    const linked = getLinkedInvoice(selectedPayment);
    return linked ? getInvoiceServiceDates(linked, sub, plans) : { rechargeDate: "", expiryDate: "" };
  }, [selectedPayment, subscribers, invoices, plans]);

  const [formData, setFormData] = useState({ subscriberId: "", amount: 0, method: "Cash" as "Cash" | "UPI" });
  const [filterMonth, setFilterMonth] = useState<number | "all">(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | "all">(new Date().getFullYear());
  const [areaF, setAreaF] = useState<string>("all");
  const [methodF, setMethodF] = useState<string>("all");

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2024, 2025, 2026, 2027, 2028, 2029];
  const areas = useMemo(() => Array.from(new Set(subscribers.map(s => s.area))).filter(Boolean).sort(), [subscribers]);

  const filtered = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    return payments.filter(p => {
      const sub = subscribers.find(s => s.id === p.subscriberId);
      const matchQ = tokens.length === 0 || tokens.every(t => 
        (sub?.name || "").toLowerCase().includes(t) || 
        (sub?.area || "").toLowerCase().includes(t) || 
        (sub?.id || "").toLowerCase().includes(t) || 
        (p.id || "").toLowerCase().includes(t)
      );
      const payDate = new Date(p.date);
      const matchMonth = filterMonth === "all" || (payDate.getMonth() === filterMonth && payDate.getFullYear() === filterYear);
      const matchArea = areaF === "all" || sub?.area === areaF;
      const matchMethod = methodF === "all" || p.method === methodF;
      return matchQ && matchMonth && matchArea && matchMethod;
    });
  }, [q, payments, subscribers, filterMonth, filterYear, areaF, methodF]);

  const sorted = [...filtered].sort((a,b) => +new Date(b.date) - +new Date(a.date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subscriberId || formData.amount <= 0) return toast.error("Invalid input protocol");
    try {
      setIsSubmitting(true);
      const newPay = await recordPayment({ ...formData, date: new Date().toISOString(), agent: "System Admin" });
      toast.success("Transaction Record Created");
      setIsAddOpen(false);
      setSelectedPayment(newPay);
      setIsReceiptOpen(true);
    } catch (err) { toast.error("Transaction failed"); } finally { setIsSubmitting(false); }
  };

  const handleWhatsApp = (p: any) => {
    const sub = subscribers.find(s => s.id === p.subscriberId);
    if (!sub?.phone) return toast.error("Entity has no communication address");
    const cleanPhone = sub.phone.replace(/\D/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const items = getPaymentItems(p);
    const linked = getLinkedInvoice(p);
    const service = linked ? getInvoiceServiceDates(linked, sub, plans) : { expiryDate: "" };
    const msg = `*PAYMENT ACKNOWLEDGEMENT*\nEntity: ${sub.name}\nAmount: Rs. ${p.amount}\nMethod: ${p.method}\nTimestamp: ${formatDate(p.date)}\n${service.expiryDate ? `Cycle End: ${formatDate(service.expiryDate)}\n` : ""}Current Balance: Rs. ${sub.balance}\n\nProtocol Auth: ${brand.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadReceipt = async () => {
    const element = document.getElementById("receipt-content");
    if (!element) return;
    setIsSubmitting(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf().set({ margin: 0, filename: `Voucher_${selectedPayment.id.slice(-8)}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(element).save();
      toast.success("Voucher Exported");
    } catch (e) { toast.error("Export failed"); } finally { setIsSubmitting(false); }
  };

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + Number(p.amount), 0);
  const upiTotal = filtered.filter(p => p.method !== 'Cash').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 w-fit">
            <Wallet className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">Asset Settlement Terminal</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
            Payment <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Protocol</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Revenue Collection & Voucher Registry</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-6 px-6 py-2 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl lg:flex">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Liquid (Cash)</span>
              <span className="text-base font-black text-white italic tracking-tighter tabular-nums">₹{cashTotal.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital (UPI)</span>
              <span className="text-base font-black text-white italic tracking-tighter tabular-nums">₹{upiTotal.toLocaleString()}</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { setIsGlobalRefreshing(true); refreshData().finally(() => setIsGlobalRefreshing(false)); }}
            disabled={isGlobalRefreshing}
            className="h-12 rounded-xl border-white/5 bg-slate-900/40 px-6 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition-all backdrop-blur-xl"
          >
            <Activity className={cn("mr-2 h-4 w-4", isGlobalRefreshing && "animate-spin")} />
            Sync Ledger
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-12 rounded-xl bg-emerald-600 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> Record Settlement
          </Button>
        </div>
      </div>

      {/* Industrial Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 app-panel p-4 border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-500 transition-all" />
            <Input
              placeholder="SEARCH BY HASH, ENTITY OR REGION..."
              className="h-11 rounded-xl border-white/5 bg-slate-950/50 pl-11 text-[10px] font-bold tracking-widest text-white placeholder:text-slate-600 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10 transition-all uppercase"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <select 
              value={areaF} 
              onChange={(e) => setAreaF(e.target.value)} 
              className="w-full h-10 bg-slate-950 border border-white/5 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-emerald-500/40 appearance-none shadow-inner"
            >
              <option value="all">ALL NETWORK SECTORS</option>
              {areas.map(a => <option key={a} value={a} className="bg-slate-900">{a.toUpperCase()}</option>)}
            </select>
            <select 
              value={methodF} 
              onChange={(e) => setMethodF(e.target.value)} 
              className="w-full h-10 bg-slate-950 border border-white/5 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-emerald-500/40 appearance-none shadow-inner"
            >
              <option value="all">ALL MODES</option>
              <option value="Cash" className="bg-slate-900">LIQUID CASH</option>
              <option value="UPI" className="bg-slate-900">DIGITAL UPI</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-4 app-panel p-4 border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl flex flex-col justify-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Temporal Filter Scope</span>
          <div className="flex gap-1.5 p-1 bg-slate-950 border border-white/5 rounded-xl">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex-1 h-10 bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white outline-none appearance-none px-4">
              {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m.toUpperCase()}</option>)}
            </select>
            <div className="w-px h-6 my-auto bg-white/5" />
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="w-24 h-10 bg-transparent border-none text-[10px] font-black uppercase text-white outline-none appearance-none px-4 text-center">
              {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>
        </div>

        <div className="lg:col-span-3 app-panel p-4 border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl flex flex-col justify-center items-center gap-2">
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Registry Health</span>
           <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-white italic">{sorted.length}</span>
                <span className="text-[7px] font-black uppercase text-slate-600 tracking-tighter">TRANS_X</span>
              </div>
              <div className="w-px h-6 bg-white/5" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-emerald-500 italic">₹{(cashTotal + upiTotal).toLocaleString()}</span>
                <span className="text-[7px] font-black uppercase text-slate-600 tracking-tighter">LEDGER_BAL</span>
              </div>
           </div>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="app-panel overflow-hidden border border-white/5 bg-slate-900/30 backdrop-blur-3xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Voucher / Ref</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Entity Metadata</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Allocated Assets</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Settled Value (₹)</th>
                <th className="px-6 py-4 w-40"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="py-32 text-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" /></td></tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-20">
                      <Activity className="h-16 w-16 text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">NO TRANSACTION RECORDS IN SCOPE</span>
                    </div>
                  </td>
                </tr>
              ) : sorted.map((p) => {
                const sub = subscribers.find(s => s.id === p.subscriberId);
                const items = getPaymentItems(p);
                return (
                  <tr key={p.id} className="hover:bg-emerald-600/[0.03] transition-all duration-300 group border-l-2 border-transparent hover:border-emerald-600">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white tracking-widest tabular-nums group-hover:text-emerald-400 transition-colors uppercase italic">#TRN-{p.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mt-1.5 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> {formatDate(p.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-black text-white uppercase italic tracking-tight">{sub?.name || 'Unknown_Entity'}</span>
                          <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">#{sub?.customerNo}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5"><MapPin className="h-3 w-3 opacity-50" /> {sub?.area || "STATIC_REGION"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {items.slice(0, 2).map((it, idx) => (
                          <span key={idx} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-500/5 text-emerald-500/80 border border-emerald-500/10 italic">{it.desc}</span>
                        ))}
                        {items.length > 2 && <span className="text-[8px] font-black uppercase text-slate-600 flex items-center gap-1"><Plus className="h-2 w-2" /> {items.length - 2} ADDTL</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-base font-black text-white tracking-tighter tabular-nums italic">₹{Number(p.amount).toLocaleString()}</span>
                        <span className={cn("text-[9px] font-black uppercase mt-1.5 tracking-widest px-2 rounded-md py-0.5 border italic", 
                          p.method === 'Cash' ? "text-amber-500/80 bg-amber-500/5 border-amber-500/10" : "text-blue-500/80 bg-blue-500/5 border-blue-500/10")}>
                          {p.method.toUpperCase()}_MODE
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 text-slate-500 hover:text-white shadow-inner" onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all shadow-xl shadow-emerald-600/10" onClick={() => handleWhatsApp(p)}><Share2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-600/10" onClick={() => setConfirmModal(p)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-slate-900 border border-white/5 rounded-[4rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Banknote className="h-32 w-32 text-emerald-500" />
            </div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-600/20 shadow-inner">
                  <Plus className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">Initialize Settle</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">New Transaction Record</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="h-12 w-12 rounded-2xl text-slate-500 hover:bg-slate-800"><X className="h-6 w-6" /></Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Entity Account Selector</label>
                <select 
                  value={formData.subscriberId} 
                  onChange={(e) => setFormData({...formData, subscriberId: e.target.value})} 
                  className="w-full h-12 bg-slate-950 border border-white/5 rounded-2xl px-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-emerald-500/50 shadow-inner appearance-none transition-all"
                >
                  <option value="">SELECT TARGET NODE...</option>
                  {subscribers.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">#{s.customerNo} {s.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Asset Value (₹)</label>
                  <Input 
                    type="number" 
                    value={formData.amount || ""} 
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                    className="h-12 bg-slate-950 border-white/5 rounded-2xl px-4 text-center text-lg font-black text-white focus-visible:border-emerald-500/50 shadow-inner" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-600 tracking-widest ml-1">Transfer Mode</label>
                  <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                    {['Cash', 'UPI'].map(m => (
                      <button 
                        key={m} 
                        type="button" 
                        onClick={() => setFormData({...formData, method: m as any})} 
                        className={cn(
                          "flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                          formData.method === m ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" : "text-slate-600 hover:text-slate-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all" onClick={() => setIsAddOpen(false)}>Abort Command</Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.subscriberId} 
                  className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-600/30 font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                  Auth Transaction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Terminal Modal */}
      {isReceiptOpen && selectedPayment && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-3xl flex flex-col overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-600/30">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Settlement Voucher</h2>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">Official Registry Extract</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleDownloadReceipt} className="h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 border border-white/10 transition-all">
                <Download className="h-4 w-4 mr-2 text-emerald-400" /> Save_Archive
              </Button>
              <Button size="sm" onClick={() => handleWhatsApp(selectedPayment)} className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-xl shadow-emerald-600/20 transition-all">
                <Share2 className="h-4 w-4 mr-2" /> Push_WA
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsReceiptOpen(false)} className="h-10 w-10 rounded-xl text-white hover:bg-white/5 transition-all"><X className="h-5 w-5" /></Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-12 flex justify-center bg-[#09090b]">
            <div ref={containerRef} className="w-full max-w-[800px] h-fit">
               <div id="receipt-content" ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className="bg-white text-slate-950 p-16 shadow-2xl rounded-sm w-[794px] mx-auto relative">
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                     <ShieldCheck className="w-[500px] h-[500px]" />
                  </div>

                  <div className="flex justify-between items-start mb-16 border-b-[6px] border-slate-950 pb-12 relative z-10">
                    <div>
                      <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic mb-2 leading-none">{brand.name.toUpperCase()}</h2>
                      <p className="text-[11px] text-slate-500 uppercase font-black tracking-[0.5em] italic">Official Asset Settlement Acknowledgement</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Voucher Index</p>
                      <p className="text-3xl font-mono font-black text-slate-950 tracking-tighter">#VS-{selectedPayment.id.slice(-10).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-20 mb-16 relative z-10">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">Target Account Meta</p>
                      <div className="text-lg font-black text-slate-950 uppercase italic tracking-tight">{subscribers.find(s => s.id === selectedPayment.subscriberId)?.name.toUpperCase()}</div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                         <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Network Node</p>
                            <p className="text-[11px] font-black text-slate-950 uppercase">CID_{subscribers.find(s => s.id === selectedPayment.subscriberId)?.id.slice(0, 8)}</p>
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Region Hub</p>
                            <p className="text-[11px] font-black text-slate-950 uppercase">{subscribers.find(s => s.id === selectedPayment.subscriberId)?.area}</p>
                         </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">Transaction Meta</p>
                      <div className="space-y-3">
                         <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black uppercase text-slate-400">Transfer Mode</p>
                            <p className="text-[13px] font-black text-slate-950 uppercase italic">{selectedPayment.method}_LIQUIDITY</p>
                         </div>
                         <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black uppercase text-slate-400">Registry Timestamp</p>
                            <p className="text-[13px] font-black text-slate-950 uppercase italic tabular-nums">{formatDate(selectedPayment.date)}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  <table className="w-full text-left mb-16 relative z-10">
                    <thead className="border-b-[3px] border-slate-900">
                      <tr className="text-[11px] font-black uppercase text-slate-950 tracking-[0.2em]">
                        <th className="py-4">Allocation Description</th>
                        <th className="py-4 text-center">Lifecycle period</th>
                        <th className="py-4 text-right">Settled Assets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {selectedPaymentItems.map((item, i) => (
                        <tr key={i}>
                          <td className="py-6">
                            <div className="text-[13px] font-black text-slate-950 uppercase italic tracking-tight">{item.desc}</div>
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{item.subDesc}</div>
                          </td>
                          <td className="py-6 text-[11px] text-slate-950 font-black text-center uppercase font-mono tracking-widest">{item.date}</td>
                          <td className="py-6 text-[14px] font-black text-slate-950 text-right font-mono tracking-tighter italic">₹{Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-12 border-t-[5px] border-slate-950 relative z-10">
                    <div className="w-96 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Net Asset Settlement</span>
                        <span className="text-5xl font-mono font-black text-slate-950 tracking-tighter italic">₹{Number(selectedPayment.amount).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-6 border-2 border-slate-100 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.1em]">Remaining Node Backlog</span>
                          <span className="text-lg font-mono font-black text-slate-950 tabular-nums">₹{subscribers.find(s => s.id === selectedPayment.subscriberId)?.balance || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-32 flex justify-between items-end relative z-10">
                    <div className="max-w-[400px]">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-loose italic">
                         THIS IS A CERTIFIED CRYPTOGRAPHIC VOUCHER EXTRACT. NO PHYSICAL SIGNATURE REQUIRED. AUDIT COMPLIANCE SECURED BY {brand.name.toUpperCase()} CORE SYSTEMS.
                       </p>
                    </div>
                    <div className="text-center px-12 border-t-[3px] border-slate-950 pt-4">
                       <p className="text-[12px] font-black uppercase text-slate-950 tracking-[0.3em] italic">Chief Audit Head</p>
                       <p className="text-[9px] text-slate-400 font-black uppercase mt-1.5 tracking-[0.2em]">Financial Security Div.</p>
                    </div>
                  </div>
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
              IRREVERSIBLE TRANSACTION PURGE INITIATED. AUTHENTICATE COMMAND EXECUTION.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                className="h-14 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] bg-rose-600 hover:bg-rose-500 shadow-2xl shadow-rose-600/30 transition-all active:scale-95" 
                onClick={() => { deletePayment(confirmModal.id); setConfirmModal(null); toast.success("Ledger Expunged"); }}
              >
                Confirm Deletion
              </Button>
              <Button variant="ghost" className="h-14 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all" onClick={() => setConfirmModal(null)}>Abort Command</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
