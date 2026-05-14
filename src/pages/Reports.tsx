import React, { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Download, Calendar, BarChart3, TrendingUp, Wallet, Receipt, Users, Loader2, ShieldCheck, MapPin, Eye, AlertCircle, Phone, X, ChevronRight, Shield } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { GUJARATI_FONT } from "@/lib/fonts/gujarati";
import { useBusinessMode } from "@/lib/turso";
import { getBrandSettings } from "@/lib/branding";
import { cn } from "@/lib/utils";

// ── REUSABLE AUDIT REPORT TEMPLATE ──
const AuditReportTemplate = ({ 
  id, 
  monthName, 
  selectedYear, 
  selectedMonth, 
  selectedArea, 
  monthStats, 
  filteredPayments, 
  filteredExpenses, 
  integrityScore, 
  companySettings, 
  subscribers,
  businessMode,
}: any) => {
  const customerIdLabel = businessMode === "cable" ? "STB Number" : "Customer ID";
  const businessModeLabel = businessMode === "cable" ? "Cable Mode" : "Broadband Mode";
  const brand = getBrandSettings(companySettings);
  return (
    <div id={id} style={{ 
      width: '794px', 
      backgroundColor: '#fff', 
      color: '#1e293b', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      padding: '0',
      boxShadow: '0 0 40px rgba(0,0,0,0.1)'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @font-face {
          font-family: 'Gujarati';
          src: url(data:font/ttf;base64,${GUJARATI_FONT});
        }
        .gujarati { font-family: 'Gujarati', system-ui, sans-serif !important; font-size: 14px !important; line-height: 1.2; }
        .report-header { background-color: #020617; color: #fff; padding: 42px; border-bottom: 6px solid #2563eb; page-break-inside: avoid; }
        .logo-box { width: 104px; height: 104px; background: #fff; border-radius: 18px; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 35px rgb(0 0 0 / 0.24); }
        .badge { background: #2563eb; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; display: inline-block; }
        .mode-badge { margin-top: 10px; background: rgb(37 99 235 / 0.1); color: #60a5fa; border: 1px solid rgb(59 130 246 / 0.3); padding: 5px 12px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; display: inline-block; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 30px 40px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; }
        .stat-box { border-left: 3px solid #cbd5e1; padding-left: 15px; }
        .stat-label { font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px; }
        .stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }
        .report-body { padding: 40px; }
        .table-title { font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; page-break-after: avoid; }
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th { background: #f1f5f9; color: #475569; font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        .audit-table td { padding: 12px; font-size: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .audit-table tr { page-break-inside: avoid; break-inside: avoid; }
        .footer { margin-top: 50px; padding: 40px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; page-break-inside: avoid; }
        .sign-box { width: 180px; border-top: 1px solid #0f172a; margin-top: 40px; padding-top: 10px; text-align: center; }
      `}} />

      <div className="report-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '26px', alignItems: 'center' }}>
            <div className="logo-box">
              <Logo size="xl" showText={false} iconClassName="h-full w-full rounded-2xl border-0 p-0 shadow-none" />
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: '900', margin: 0, letterSpacing: '0.26em', color: '#94a3b8', textTransform: 'uppercase' }}>Sitaram Network Infrastructure</p>
              <h1 style={{ fontSize: '30px', fontWeight: '900', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>{brand.name}</h1>
              <span className="mode-badge">{businessModeLabel}</span>
              <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '6px', maxWidth: '320px', lineHeight: '1.5' }}>{brand.address}</p>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px', fontSize: '10px', opacity: 0.9 }}>
                <span><strong>Phone:</strong> {brand.phone}</span>
                <span><strong>Email:</strong> {brand.email}</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="badge">AUDIT RECONCILIATION</div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '10px 0 0 0', color: '#2563eb' }}>{monthName}</h2>
            <p style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginTop: '5px' }}>
              Cycle: {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box" style={{ borderLeftColor: '#2563eb' }}>
          <div className="stat-label">Total Collections</div>
          <div className="stat-value" style={{ color: '#1e40af' }}>{formatCurrency(monthStats.revenue)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#ef4444' }}>
          <div className="stat-label">Expenditure</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{formatCurrency(monthStats.expenses)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#2563eb' }}>
          <div className="stat-label">Net Yield</div>
          <div className="stat-value" style={{ color: '#1d4ed8' }}>{formatCurrency(monthStats.revenue - monthStats.expenses)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#64748b' }}>
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{filteredPayments.length} LOGGED</div>
        </div>
      </div>

      <div className="report-body">
        <div className="table-title">
          <div style={{ width: '4px', height: '18px', background: '#2563eb', borderRadius: '2px' }}></div>
          Collection Protocol Ledger — {selectedArea}
        </div>

        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>ID</th>
              <th style={{ width: '85px' }}>Date</th>
              <th>Subscriber Identity</th>
              <th style={{ width: '130px' }}>{customerIdLabel}</th>
              <th>Area</th>
              <th style={{ width: '60px' }}>Type</th>
              <th style={{ textAlign: 'right', width: '100px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((p: any, idx: number) => {
              const sub = subscribers.find((s: any) => s.id === p.subscriberId);
              const isGujarati = /[\u0a80-\u0aff]/.test(sub?.name || '');
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: '900', color: '#64748b' }}>{sub?.customerNo || idx+1}</td>
                  <td style={{ fontWeight: '600' }}>{formatDate(p.date)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className={isGujarati ? 'gujarati' : ''} style={{ fontWeight: '800', color: '#0f172a', fontSize: isGujarati ? '13px' : '11px' }}>
                        {sub?.name || 'Unknown'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>{sub?.phone || '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: '700', letterSpacing: '0.05em' }}>
                    {sub?.customerId || '—'}
                  </td>
                  <td style={{ fontWeight: '600', color: '#475569' }}>{sub?.area || 'General'}</td>
                  <td>
                    <span style={{ 
                      fontSize: '8px', 
                      fontWeight: '900', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      color: '#475569'
                    }}>{p.method}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '11px' }}>{formatCurrency(p.amount)}</td>
                </tr>
              );
            })}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={6} style={{ textAlign: 'right', padding: '15px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>Total Periodic Collection</td>
              <td style={{ textAlign: 'right', padding: '15px', fontWeight: '900', fontSize: '13px', color: '#2563eb' }}>{formatCurrency(monthStats.revenue)}</td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <div>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>Security & Audit Protocol</p>
            <p style={{ fontSize: '9px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.4' }}>Automated reconciliation report. Verified against decentralized billing records.</p>
            <div style={{ marginTop: '20px', border: '2px solid #2563eb', color: '#2563eb', padding: '6px 15px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '11px' }}>CERTIFIED AUDIT RECORD</div>
          </div>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div className="sign-box"><p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Accountant</p></div>
            <div className="sign-box">
              <p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Network Director</p>
              <p style={{ fontSize: '11px', fontWeight: '900', marginTop: '15px', color: '#0f172a' }}>{brand.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const currentBusinessMode = useBusinessMode();
  const customerIdLabel = currentBusinessMode === "cable" ? "STB Number" : "Customer ID";
  const billing = useBilling();
  
  const { 
    stats: s = {}, 
    payments = [], 
    subscribers = [], 
    companySettings = {}, 
    expenses = [], 
    isLoading: billingLoading = false 
  } = billing || {};

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEndMonth, setSelectedEndMonth] = useState(new Date().getMonth());
  const [selectedEndYear, setSelectedEndYear] = useState(new Date().getFullYear());
  const [selectedArea, setSelectedArea] = useState("All Addresses");
  const [selectedMethod, setSelectedMethod] = useState("All Methods");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      setScale(Math.min(1, Math.max(0.3, containerWidth / targetWidth)));
    };

    if (isPreviewOpen) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isPreviewOpen]);
  
  const stats = useMemo(() => ({ 
    monthRevenue: s.monthRevenue || 0, 
    monthExpenses: s.monthExpenses || 0, 
    pendingDues: s.pendingDues || 0,
    active: s.active || 0,
  }), [s]);

  const areas = useMemo(() => {
    const uniqueAreas = Array.from(new Set(subscribers.map(sub => sub.area).filter(Boolean)));
    return ["All Addresses", ...uniqueAreas];
  }, [subscribers]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (!p || !p.date) return false;
      const d = new Date(p.date);
      const payTime = d.getFullYear() * 12 + d.getMonth();
      const startTime = selectedYear * 12 + selectedMonth;
      const endTime = selectedEndYear * 12 + selectedEndMonth;
      if (!(payTime >= startTime && payTime <= endTime)) return false;
      if (selectedMethod !== "All Methods" && p.method !== selectedMethod) return false;
      if (selectedArea === "All Addresses") return true;
      const sub = subscribers.find(sub => sub.id === p.subscriberId);
      return sub?.area === selectedArea;
    }).sort((a, b) => {
      const subA = subscribers.find(s => s.id === a.subscriberId);
      const subB = subscribers.find(s => s.id === b.subscriberId);
      return (subA?.customerNo || 0) - (subB?.customerNo || 0);
    });
  }, [payments, selectedMonth, selectedYear, selectedEndMonth, selectedEndYear, selectedArea, selectedMethod, subscribers]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e || !e.date) return false;
      const d = new Date(e.date);
      const expTime = d.getFullYear() * 12 + d.getMonth();
      const startTime = selectedYear * 12 + selectedMonth;
      const endTime = selectedEndYear * 12 + selectedEndMonth;
      return expTime >= startTime && expTime <= endTime;
    });
  }, [expenses, selectedMonth, selectedYear, selectedEndMonth, selectedEndYear]);

  const monthNameLong = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    const end = new Date(selectedEndYear, selectedEndMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    return start === end ? start : `${start} — ${end}`;
  }, [selectedMonth, selectedYear, selectedEndMonth, selectedEndYear]);

  const monthStats = useMemo(() => {
    const revenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { revenue, expenses: expensesTotal };
  }, [filteredPayments, filteredExpenses]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const collectionData = filteredPayments.map((p, idx) => {
        const sub = subscribers.find(s => s.id === p.subscriberId);
        return {
          "ID": sub?.customerNo || idx + 1,
          "Date": formatDate(p.date),
          "Name": sub?.name || 'Unknown',
          "Area": sub?.area || 'N/A',
          "Method": p.method,
          "Amount": Number(p.amount) || 0
        };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(collectionData), "Collections");
      XLSX.writeFile(wb, `Audit_${monthNameLong.replace(/ /g, '_')}.xlsx`);
      toast.success("Excel Protocol Exported");
    } catch (error) {
      toast.error("Export Failed");
    }
  };

  const handleDownloadPremiumReport = async () => {
    const element = document.getElementById("premium-report-template");
    if (!element) return;
    setIsGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 10,
        filename: `Audit_${monthNameLong.replace(' ', '_')}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, width: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF Protocol Issued");
    } catch (err) {
      toast.error("Generation Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const integrityScore = monthStats.revenue / (stats.pendingDues + monthStats.revenue || 1);

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* INDUSTRIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black mb-1 flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-500" />
            ANALYTICS · AUDIT INFRASTRUCTURE
          </p>
          <h1 className="font-display text-2xl font-black tracking-tighter text-white uppercase leading-none">
            Business <span className="text-blue-600 italic">Intelligence</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="h-8 px-3 rounded-md border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-500 text-[9px] uppercase font-black tracking-widest transition-all">
            <Eye className="h-3.5 w-3.5 mr-2" /> Preview
          </Button>
          <Button onClick={handleDownloadPremiumReport} disabled={isGenerating} className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-600/20 transition-all">
            {isGenerating ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
            PDF Protocol
          </Button>
        </div>
      </div>

      {/* COMPACT FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full h-8 pl-9 pr-6 bg-slate-900/60 border-slate-800 rounded-lg text-white font-black text-[9px] uppercase tracking-widest focus:outline-none focus:ring-0 focus:border-blue-600/50 appearance-none transition-all">
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i} className="bg-slate-900">{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div className="relative group">
          <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full h-8 pl-9 pr-6 bg-slate-900/60 border-slate-800 rounded-lg text-white font-black text-[9px] uppercase tracking-widest focus:outline-none focus:ring-0 focus:border-blue-600/50 appearance-none transition-all">
            {[2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
          </select>
        </div>
        <div className="relative group">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full h-8 pl-9 pr-6 bg-slate-900/60 border-slate-800 rounded-lg text-white font-black text-[9px] uppercase tracking-widest focus:outline-none focus:ring-0 focus:border-blue-600/50 appearance-none transition-all">
            {areas.map(area => (
              <option key={area} value={area} className="bg-slate-900">{area}</option>
            ))}
          </select>
        </div>
        <div className="relative group">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="w-full h-8 pl-9 pr-6 bg-slate-900/60 border-slate-800 rounded-lg text-white font-black text-[9px] uppercase tracking-widest focus:outline-none focus:ring-0 focus:border-blue-600/50 appearance-none transition-all">
            <option value="All Methods" className="bg-slate-900">All Methods</option>
            <option value="Cash" className="bg-slate-900">Cash</option>
            <option value="UPI" className="bg-slate-900">UPI / Digital</option>
          </select>
        </div>
      </div>

      {/* STATS INFRASTRUCTURE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Audit Integrity", value: `${(integrityScore * 100).toFixed(1)}%`, icon: ShieldCheck, color: "blue" },
          { label: "Net Revenue", value: formatCurrency(monthStats.revenue), icon: TrendingUp, color: "blue" },
          { label: "Total Dues", value: formatCurrency(stats.pendingDues), icon: AlertCircle, color: "rose" },
          { label: "Active Nodes", value: stats.active, icon: Users, color: "indigo" }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-xl border border-slate-800/50 shadow-xl group hover:border-blue-600/30 transition-all">
            <div className="flex justify-between items-center mb-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", 
                item.color === "blue" ? "bg-blue-600/10 text-blue-500 border-blue-600/20" : 
                item.color === "rose" ? "bg-rose-600/10 text-rose-500 border-rose-600/20" : 
                "bg-indigo-600/10 text-indigo-400 border-indigo-600/20"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</span>
            </div>
            <p className="text-xl font-black text-white tracking-tighter tabular-nums leading-none">{item.value}</p>
          </div>
        ))}
      </div>

      {/* DUAL LEDGER PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "Collection Ledger", icon: Receipt, data: filteredPayments, type: "collection" },
          { title: "Expenditure Ledger", icon: BarChart3, data: filteredExpenses, type: "expense" }
        ].map((ledger, idx) => (
          <div key={idx} className="bg-slate-900/40 backdrop-blur-2xl rounded-xl border border-slate-800/50 shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-white flex items-center gap-2">
                <ledger.icon className="h-3.5 w-3.5 text-blue-600" />
                {ledger.title}
              </h3>
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{ledger.data.length} Entries</span>
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10 border-b border-slate-800">
                  <tr className="text-[7px] uppercase tracking-[0.2em] text-slate-600 font-black">
                    <th className="px-5 py-2.5">{ledger.type === "collection" ? "Subscriber" : "Category"}</th>
                    <th className="px-5 py-2.5">Date</th>
                    <th className="px-5 py-2.5 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {ledger.data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                      <td className="px-5 py-2.5">
                        {ledger.type === "collection" ? (
                          <>
                            <p className="text-[10px] font-black text-white group-hover:text-blue-500 transition-colors">{subscribers.find(s => s.id === item.subscriberId)?.name || "Unknown"}</p>
                            <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">{subscribers.find(s => s.id === item.subscriberId)?.area || "General"}</p>
                          </>
                        ) : (
                          <>
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[7px] font-black uppercase text-blue-500">{item.category}</span>
                            <p className="text-[7px] font-black text-slate-600 mt-1 uppercase truncate max-w-[120px]">{item.description}</p>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-[8px] font-black text-slate-500 uppercase">{formatDate(item.date)}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <span className="font-mono font-black text-[10px] text-white">{formatCurrency(item.amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* HIDDEN REPORT PROTOCOL TEMPLATE */}
      <div style={{ display: 'none' }}>
        <AuditReportTemplate 
          id="premium-report-template"
          monthName={monthNameLong}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedArea={selectedArea}
          monthStats={monthStats}
          filteredPayments={filteredPayments}
          filteredExpenses={filteredExpenses}
          integrityScore={integrityScore}
          companySettings={companySettings}
          subscribers={subscribers}
          businessMode={currentBusinessMode}
        />
      </div>

      {/* PREVIEW PROTOCOL MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300">
           <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-lg shadow-blue-600/10">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Audit Protocol Preview</h2>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em]">{monthNameLong}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white" onClick={() => setIsPreviewOpen(false)}>
                  Dismiss
                </Button>
                <Button onClick={handleDownloadPremiumReport} disabled={isGenerating} className="h-10 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Export PDF Protocol
                </Button>
              </div>
            </div>
            
            <div ref={containerRef} className="flex-1 overflow-auto custom-scrollbar flex justify-center bg-slate-950/50 rounded-[3rem] border border-slate-800/50 p-12">
              <div className="shadow-[0_0_100px_rgba(0,0,0,0.5)] origin-top transition-transform duration-500" style={{ transform: `scale(${scale})` }}>
                <AuditReportTemplate 
                  id="preview-template"
                  monthName={monthNameLong}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  selectedArea={selectedArea}
                  monthStats={monthStats}
                  filteredPayments={filteredPayments}
                  filteredExpenses={filteredExpenses}
                  integrityScore={integrityScore}
                  companySettings={companySettings}
                  subscribers={subscribers}
                  businessMode={currentBusinessMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
