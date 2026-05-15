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
import { Logo } from "@/components/Logo";
import PaymentReceiptModal from "@/components/payment/PaymentReceiptModal";
import * as XLSX from 'xlsx';

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
    
    // Clean plan name for Cable mode
    // Clean plan name for Cable mode aggressively
    let planName = plan?.name || 'Service';
    if (isCableMode && planName) {
      planName = planName
        .replace(/\[[^\]]*mbps[^\]]*\]/gi, "")
        .replace(/\([^\)]*mbps[^\)]*\)/gi, "")
        .replace(/\d+\s*mbps/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\[\s*\]/g, "")
        .replace(/\(\s*\)/g, "")
        .trim();
    }

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
          desc: `${isCableMode ? 'Cable TV' : 'Broadband'} Service (${inv.billingPeriod || invDate.toLocaleString('default', { month: 'short', year: '2-digit' }).toUpperCase()})`, 
          subDesc: `${planName} Plan`, 
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

  const handleExportExcel = () => {
    try {
      const exportData = sorted.map(p => {
        const sub = subscribers.find(s => s.id === p.subscriberId);
        return {
          'Receipt ID': p.id,
          'Date': formatDate(p.date),
          'Subscriber': sub?.name || 'Unknown',
          [isCableMode ? 'STB No' : 'CID']: sub?.customerId || '',
          'Amount': p.amount,
          'Method': p.method,
          'Agent': p.agent || 'Direct'
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payments");
      XLSX.writeFile(wb, `Payments_${activeBusinessMode}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Payments Exported to Excel");
    } catch (err) {
      console.error('Export error:', err);
      toast.error("Failed to export Excel");
    }
  };

  const cashTotal = filtered.filter(p => p.method === 'Cash').reduce((s, p) => s + Number(p.amount), 0);
  const upiTotal = filtered.filter(p => p.method !== 'Cash').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Payments</h1>
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border animate-in fade-in zoom-in duration-300",
              isCableMode 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            )}>
              {activeBusinessMode} Mode
            </div>
          </div>
          <p className="text-sm text-slate-400">Revenue collection and voucher registry.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-lg bg-slate-900 border border-white/10">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Cash</span>
              <span className="text-sm font-medium text-white">₹{cashTotal.toLocaleString()}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">UPI</span>
              <span className="text-sm font-medium text-white">₹{upiTotal.toLocaleString()}</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { setIsGlobalRefreshing(true); refreshData().finally(() => setIsGlobalRefreshing(false)); }}
            disabled={isGlobalRefreshing}
            className="h-10 rounded-lg border-white/10 bg-slate-900 px-4 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Activity className={cn("mr-2 h-4 w-4", isGlobalRefreshing && "animate-spin")} />
            Sync
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportExcel}
            className="h-10 rounded-lg border-white/10 bg-slate-900 px-4 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by ID, name or area..."
              className="h-10 rounded-lg border-white/10 bg-slate-900 pl-9 text-sm text-white placeholder:text-slate-500 focus-visible:border-indigo-500"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select 
            value={areaF} 
            onChange={(e) => setAreaF(e.target.value)} 
            className="h-10 bg-slate-900 border border-white/10 rounded-lg px-3 text-sm text-slate-300 outline-none focus:border-indigo-500 sm:w-40"
          >
            <option value="all">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select 
            value={methodF} 
            onChange={(e) => setMethodF(e.target.value)} 
            className="h-10 bg-slate-900 border border-white/10 rounded-lg px-3 text-sm text-slate-300 outline-none focus:border-indigo-500 sm:w-36"
          >
            <option value="all">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div className="lg:col-span-4 flex items-center gap-2">
          <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex-1 bg-transparent text-sm text-slate-300 outline-none appearance-none cursor-pointer">
              {months.map((m, i) => <option key={m} value={i} className="bg-slate-900">{m}</option>)}
            </select>
            <div className="h-4 w-px bg-white/10" />
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="w-20 bg-transparent text-sm text-slate-300 outline-none appearance-none cursor-pointer text-center">
              {years.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2 flex items-center justify-center gap-4 rounded-lg border border-white/10 bg-slate-900 px-4 h-10">
           <div className="flex flex-col items-center justify-center">
             <span className="text-sm font-medium text-white leading-none">{sorted.length}</span>
             <span className="text-[10px] text-slate-500 uppercase">Records</span>
           </div>
           <div className="h-6 w-px bg-white/10" />
           <div className="flex flex-col items-center justify-center">
             <span className="text-sm font-medium text-emerald-400 leading-none">₹{(cashTotal + upiTotal).toLocaleString()}</span>
             <span className="text-[10px] text-slate-500 uppercase">Total</span>
           </div>
        </div>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
           <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
        ) : sorted.length === 0 ? (
           <div className="py-12 text-center text-slate-500 border border-white/10 rounded-lg bg-slate-900">
             No payments found.
           </div>
        ) : (
           sorted.map(p => {
              const sub = subscribers.find(s => s.id === p.subscriberId);
              const items = getPaymentItems(p);
              return (
                <div key={p.id} className="bg-slate-900 border border-white/10 rounded-lg p-4 space-y-4 relative">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="font-medium text-white flex items-center gap-2">
                           {sub?.name || 'Unknown'} 
                           <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">#{sub?.customerNo}</span>
                         </div>
                         <div className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {sub?.area || "N/A"}</div>
                      </div>
                      <div className="text-right">
                         <div className="font-medium text-white">₹{Number(p.amount).toLocaleString()}</div>
                         <div className={cn("text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded w-fit ml-auto", p.method === 'Cash' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500")}>
                           {p.method}
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 p-2 rounded">
                      <Calendar className="h-3 w-3" /> {formatDate(p.date)}
                      <span className="text-slate-600">|</span>
                      <span>#{p.id.slice(-6).toUpperCase()}</span>
                   </div>
                   {items.length > 0 && (
                     <div className="flex flex-wrap gap-1 mt-2">
                        {items.slice(0, 2).map((it, idx) => (
                           <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{it.desc}</span>
                        ))}
                        {items.length > 2 && <span className="text-[10px] text-slate-500">+{items.length - 2} more</span>}
                     </div>
                   )}
                   <div className="flex gap-2 pt-2 border-t border-white/5">
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs bg-slate-950 hover:bg-slate-800" onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }}><Eye className="h-3 w-3 mr-1" /> View</Button>
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20" onClick={() => handleWhatsApp(p)}><Share2 className="h-3 w-3 mr-1" /> Share</Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" onClick={() => setConfirmModal(p)}><Trash2 className="h-3 w-3" /></Button>
                   </div>
                </div>
              );
           })
        )}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block rounded-lg border border-white/10 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 border-b border-white/10 text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Receipt Info</th>
                <th className="px-4 py-3 font-medium">Customer Details</th>
                <th className="px-4 py-3 font-medium">Items Covered</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" /></td></tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              ) : sorted.map((p) => {
                const sub = subscribers.find(s => s.id === p.subscriberId);
                const items = getPaymentItems(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-medium">#{p.id.slice(-8).toUpperCase()}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(p.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{sub?.name || 'Unknown'}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">#{sub?.customerNo}</span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {sub?.area || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {items.slice(0, 2).map((it, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{it.desc}</span>
                        ))}
                        {items.length > 2 && <span className="text-[10px] text-slate-500">+{items.length - 2} more</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-white font-medium">₹{Number(p.amount).toLocaleString()}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", 
                          p.method === 'Cash' ? "text-amber-500 bg-amber-500/10" : "text-blue-500 bg-blue-500/10")}>
                          {p.method}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => { setSelectedPayment(p); setIsReceiptOpen(true); }}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20" onClick={() => handleWhatsApp(p)}><Share2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20" onClick={() => setConfirmModal(p)}><Trash2 className="h-4 w-4" /></Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Record Payment</h2>
                  <p className="text-xs text-slate-400">Add a new payment record</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white"><X className="h-4 w-4" /></Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Customer</label>
                <select 
                  value={formData.subscriberId} 
                  onChange={(e) => setFormData({...formData, subscriberId: e.target.value})} 
                  className="w-full h-10 bg-slate-950 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Select customer...</option>
                  {subscribers.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                    <option key={s.id} value={s.id}>#{s.customerNo} {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Amount (₹)</label>
                  <Input 
                    type="number" 
                    value={formData.amount || ""} 
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} 
                    className="h-10 bg-slate-950 border-white/10 rounded-lg px-3 text-sm text-white focus-visible:border-indigo-500" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Payment Method</label>
                  <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-white/10">
                    {['Cash', 'UPI'].map(m => (
                      <button 
                        key={m} 
                        type="button" 
                        onClick={() => setFormData({...formData, method: m as any})} 
                        className={cn(
                          "flex-1 h-8 rounded-md text-sm font-medium transition-colors",
                          formData.method === m ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-10 bg-slate-800 hover:bg-slate-700 text-white" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.subscriberId} 
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Modal */}
      {isReceiptOpen && selectedPayment && (
        <PaymentReceiptModal
          brand={brand}
          customerIdLabel={customerIdLabel}
          payment={selectedPayment}
          subscribers={subscribers}
          onClose={() => setIsReceiptOpen(false)}
          isCableMode={isCableMode}
          plans={plans}
          invoices={invoices}
          payments={payments}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-xl p-6 text-center shadow-xl">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Delete Payment</h2>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete this payment record? This action cannot be undone and will affect the customer's balance.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 bg-slate-800 hover:bg-slate-700 text-white" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" 
                onClick={() => { deletePayment(confirmModal.id); setConfirmModal(null); toast.success("Payment deleted"); }}
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
