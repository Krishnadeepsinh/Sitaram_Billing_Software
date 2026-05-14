import { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate, formatMonthRanges } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Search, Receipt, Wallet, Banknote, Filter, Loader2, Trash2, Download, Eye, X, Activity, Share2, Smartphone, AlertCircle, Check, Smartphone as PhoneIcon } from "lucide-react";
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
  const [contentHeight, setContentHeight] = useState(1122);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      setScale(newScale);
      setTimeout(() => {
        if (contentRef.current) setContentHeight(contentRef.current.offsetHeight);
      }, 50);
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
    const planPrice = plan?.price || 200;
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
    if (!formData.subscriberId || formData.amount <= 0) return toast.error("Invalid data");
    try {
      setIsSubmitting(true);
      const newPay = await recordPayment({ ...formData, date: new Date().toISOString(), agent: "System Admin" });
      toast.success("Payment recorded");
      setIsAddOpen(false);
      setSelectedPayment(newPay);
      setIsReceiptOpen(true);
    } catch (err) { toast.error("Failed to record"); } finally { setIsSubmitting(false); }
  };

  const handleWhatsApp = (p: any) => {
    const sub = subscribers.find(s => s.id === p.subscriberId);
    if (!sub?.phone) return toast.error("No phone");
    const cleanPhone = sub.phone.replace(/\D/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const items = getPaymentItems(p);
    const linked = getLinkedInvoice(p);
    const service = linked ? getInvoiceServiceDates(linked, sub, plans) : { expiryDate: "" };
    const msg = `*PAYMENT RECEIPT*\nHello ${sub.name},\nRecd: Rs. ${p.amount}\nMethod: ${p.method}\nDate: ${formatDate(p.date)}\n${service.expiryDate ? `Expiry: ${formatDate(service.expiryDate)}\n` : ""}Balance: Rs. ${sub.balance}\n\nThank you, ${brand.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadReceipt = async () => {
    const element = document.getElementById("receipt-content");
    if (!element) return;
    setIsSubmitting(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf().set({ margin: 0, filename: `Receipt_${selectedPayment.id}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(element).save();
      toast.success("Downloaded");
    } catch (e) { toast.error("Failed"); } finally { setIsSubmitting(false); }
  };

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + Number(p.amount), 0);
  const upiTotal = filtered.filter(p => p.method !== 'Cash').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-lg shadow-blue-900/10">
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">Transactions</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Financial Ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-bold">Cash</span>
                <span className="text-xs font-mono font-bold text-blue-400">₹{cashTotal.toLocaleString()}</span>
              </div>
              <div className="w-px h-5 bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase font-bold">UPI</span>
                <span className="text-xs font-mono font-bold text-blue-400">₹{upiTotal.toLocaleString()}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setIsGlobalRefreshing(true); refreshData().finally(() => setIsGlobalRefreshing(false)); }} className="h-8 border-slate-800 bg-slate-900/50 text-[10px] uppercase font-bold">
              <Activity className={cn("w-3 h-3 mr-2 text-blue-500", isGlobalRefreshing && "animate-spin")} />
              Sync
            </Button>
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-widest">
              <Plus className="w-3 h-3 mr-2" /> Record Payment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4">
          <div className="md:col-span-5 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <Input placeholder="Search records..." className="h-8 pl-9 bg-slate-900/50 border-slate-800 text-xs placeholder:text-slate-600" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <select value={areaF} onChange={(e) => setAreaF(e.target.value)} className="w-full h-8 px-2 bg-slate-900/50 border border-slate-800 rounded-md text-[10px] text-slate-300 uppercase font-bold focus:outline-none">
              <option value="all">All Areas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <select value={methodF} onChange={(e) => setMethodF(e.target.value)} className="w-full h-8 px-2 bg-slate-900/50 border border-slate-800 rounded-md text-[10px] text-slate-300 uppercase font-bold focus:outline-none">
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div className="md:col-span-3 flex items-center gap-1 bg-slate-900/40 border border-slate-800 rounded-md px-2 overflow-hidden">
            <span className="text-[8px] font-bold text-slate-500 uppercase ml-1">Period:</span>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-6 bg-transparent text-[10px] font-bold text-slate-300 uppercase focus:outline-none cursor-pointer">
              {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m.slice(0, 3)}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="h-6 bg-transparent text-[10px] font-bold text-slate-300 focus:outline-none cursor-pointer">
              {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[9px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Account Holder</th>
                  <th className="px-4 py-3">Allocation</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 w-32 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-xs text-slate-600 uppercase tracking-widest font-bold">No transactions found</td></tr>
                ) : sorted.map((p) => {
                  const sub = subscribers.find(s => s.id === p.subscriberId);
                  const items = getPaymentItems(p);
                  return (
                    <tr key={p.id} className="group hover:bg-blue-600/5 transition-colors border-l-2 border-transparent hover:border-blue-600">
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-tighter">#{p.id.slice(-6)}</span>
                          <span className="text-[9px] text-slate-500">{formatDate(p.date)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-200 uppercase truncate max-w-[200px]">{sub?.name || 'Unknown'}</span>
                          <span className="text-[9px] font-mono text-slate-600">#{sub?.id || '000'} \u2022 {sub?.area}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {items.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold bg-blue-600/10 border border-blue-600/20 text-blue-500">{it.desc}</span>
                          ))}
                          {items.length > 2 && <span className="text-[8px] text-slate-600">+{items.length - 2} more</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-mono font-bold text-white">₹{Number(p.amount).toLocaleString()}</span>
                          <span className={cn("text-[9px] font-bold uppercase", p.method === 'Cash' ? "text-amber-600/70" : "text-blue-600/70")}>{p.method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }} className="w-7 h-7 hover:bg-blue-600/20 text-blue-400"><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleWhatsApp(p)} className="w-7 h-7 hover:bg-blue-600/20 text-blue-400"><Share2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setConfirmModal(p)} className="w-7 h-7 hover:bg-red-600/20 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          <div>{sorted.length} Records Loaded</div>
          <div className="font-mono">Ledger Parity: <span className="text-blue-500">₹{(cashTotal + upiTotal).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl scale-in-center">
            <h3 className="text-xs font-bold text-white uppercase mb-2 tracking-widest">Confirm Purge</h3>
            <p className="text-[10px] text-slate-500 mb-6 uppercase font-bold leading-relaxed">This record will be permanently deleted from the financial ledger. This action is irreversible.</p>
            <div className="flex gap-2">
              <Button onClick={() => setConfirmModal(null)} className="flex-1 h-9 bg-slate-800 hover:bg-slate-700 text-[10px] uppercase font-bold">Cancel</Button>
              <Button onClick={() => { deletePayment(confirmModal.id); setConfirmModal(null); toast.success("Purged"); }} className="flex-1 h-9 bg-red-600 hover:bg-red-500 text-[10px] uppercase font-bold">Delete Record</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-blue-500" /> New Transaction
                </span>
                <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="w-8 h-8 text-slate-500 hover:text-white"><X className="w-4 h-4" /></Button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Account Selector</label>
                  <select value={formData.subscriberId} onChange={(e) => setFormData({...formData, subscriberId: e.target.value})} className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-600 outline-none">
                    <option value="">Select Subscriber...</option>
                    {subscribers.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900">{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Net Value (₹)</label>
                    <Input type="number" value={formData.amount || ""} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} className="h-10 bg-slate-950 border-slate-800 text-xs font-mono font-bold" placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mode</label>
                    <div className="flex gap-1 h-10">
                      {['Cash', 'UPI'].map(m => (
                        <button key={m} type="button" onClick={() => setFormData({...formData, method: m as any})} className={cn("flex-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all", formData.method === m ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/50" : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400")}>{m}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting || !formData.subscriberId} className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold tracking-[0.2em] mt-2 shadow-xl shadow-blue-900/20">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Confirm Transaction
                </Button>
              </form>
           </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && selectedPayment && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">Settlement Voucher</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleDownloadReceipt} className="h-8 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-4 border border-white/10">
                <Download className="w-3 h-3 mr-2 text-blue-400" /> Save PDF
              </Button>
              <Button size="sm" onClick={() => handleWhatsApp(selectedPayment)} className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-widest px-4">
                <Share2 className="w-3 h-3 mr-2" /> WhatsApp
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsReceiptOpen(false)} className="h-8 w-8 text-white hover:bg-white/10"><X className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-12 flex justify-center bg-[#09090b]">
            <div ref={containerRef} className="w-full max-w-[800px] h-fit">
               <div id="receipt-content" ref={contentRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className="bg-white text-slate-900 p-12 shadow-2xl rounded-sm w-[794px] mx-auto">
                  <div className="flex justify-between items-start mb-12 border-b-2 border-slate-900 pb-8">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-1">{brand.name}</h2>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Official Payment Acknowledgement</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Document No</p>
                      <p className="text-xl font-mono font-black text-slate-900">#PV-{selectedPayment.id.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-16 mb-12">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Payer Account</p>
                      <div className="text-sm font-black text-slate-900 uppercase">{subscribers.find(s => s.id === selectedPayment.subscriberId)?.name}</div>
                      <div className="text-[10px] text-slate-600 font-bold mt-1">CID: {subscribers.find(s => s.id === selectedPayment.subscriberId)?.id}</div>
                      <div className="text-[10px] text-slate-600 font-bold">Region: {subscribers.find(s => s.id === selectedPayment.subscriberId)?.area}</div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Voucher Meta</p>
                      <div className="text-[10px] font-black text-slate-900 uppercase">Settlement Mode: {selectedPayment.method}</div>
                      <div className="text-[10px] font-black text-slate-900 uppercase mt-1">Timestamp: {formatDate(selectedPayment.date)}</div>
                    </div>
                  </div>

                  <table className="w-full text-left mb-12">
                    <thead className="border-b-2 border-slate-200">
                      <tr className="text-[10px] font-black uppercase text-slate-900">
                        <th className="py-3">Description</th>
                        <th className="py-3 text-center">Period</th>
                        <th className="py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPaymentItems.map((item, i) => (
                        <tr key={i}>
                          <td className="py-4">
                            <div className="text-[11px] font-black text-slate-900 uppercase">{item.desc}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{item.subDesc}</div>
                          </td>
                          <td className="py-4 text-[10px] text-slate-900 font-bold text-center uppercase font-mono">{item.date}</td>
                          <td className="py-4 text-[11px] font-black text-slate-900 text-right font-mono">₹{Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-8 border-t-4 border-slate-900">
                    <div className="w-72 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase text-slate-400">Total Net Settled</span>
                        <span className="text-3xl font-mono font-black text-slate-900 tracking-tighter">₹{Number(selectedPayment.amount).toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-4 border border-slate-100 rounded-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-slate-500">New Account Balance</span>
                          <span className="text-xs font-mono font-black text-slate-900">₹{subscribers.find(s => s.id === selectedPayment.subscriberId)?.balance || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-24 flex justify-between items-end">
                    <div className="max-w-[340px]">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                         This is a certified electronic acknowledgement and does not require a physical signature. Issued by {brand.name} Financial Systems.
                       </p>
                    </div>
                    <div className="text-center px-10 border-t-2 border-slate-900 pt-3">
                       <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Authorized Head</p>
                       <p className="text-[8px] text-slate-400 font-black uppercase mt-1">Audit Compliance Office</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
