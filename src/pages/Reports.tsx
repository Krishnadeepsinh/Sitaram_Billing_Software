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
        .report-header { background-color: #0a1019; color: #fff; padding: 42px; border-bottom: 6px solid #3d516d; page-break-inside: avoid; }
        .logo-box { width: 104px; height: 104px; background: #fff; border-radius: 18px; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 35px rgb(0 0 0 / 0.24); }
        .badge { background: #3d516d; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; display: inline-block; }
        .mode-badge { margin-top: 10px; background: rgb(61 81 109 / 0.12); color: #8a9bb5; border: 1px solid rgb(90 108 132 / 0.35); padding: 5px 12px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; display: inline-block; }
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
            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '10px 0 0 0', color: '#3d516d' }}>{monthName}</h2>
            <p style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginTop: '5px' }}>
              Cycle: {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box" style={{ borderLeftColor: '#3d516d' }}>
          <div className="stat-label">Total Collections</div>
          <div className="stat-value" style={{ color: '#2c3e54' }}>{formatCurrency(monthStats.revenue)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#ef4444' }}>
          <div className="stat-label">Expenditure</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{formatCurrency(monthStats.expenses)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#3d516d' }}>
          <div className="stat-label">Net Yield</div>
          <div className="stat-value" style={{ color: '#33465d' }}>{formatCurrency(monthStats.revenue - monthStats.expenses)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#64748b' }}>
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{filteredPayments.length} LOGGED</div>
        </div>
      </div>

      <div className="report-body">
        <div className="table-title">
          <div style={{ width: '4px', height: '18px', background: '#3d516d', borderRadius: '2px' }}></div>
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
              <td style={{ textAlign: 'right', padding: '15px', fontWeight: '900', fontSize: '13px', color: '#3d516d' }}>{formatCurrency(monthStats.revenue)}</td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <div>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>Security & Audit Protocol</p>
            <p style={{ fontSize: '9px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.4' }}>Automated reconciliation report. Verified against decentralized billing records.</p>
            <div style={{ marginTop: '20px', border: '2px solid #3d516d', color: '#3d516d', padding: '6px 15px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '11px' }}>CERTIFIED AUDIT RECORD</div>
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
    isLoading: billingLoading = false,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate
  } = billing || {};


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
      if (!(d >= filterStartDate && d <= filterEndDate)) return false;
      if (selectedMethod !== "All Methods" && p.method !== selectedMethod) return false;
      if (selectedArea === "All Addresses") return true;
      const sub = subscribers.find(sub => sub.id === p.subscriberId);
      return sub?.area === selectedArea;
    }).sort((a, b) => {
      const subA = subscribers.find(s => s.id === a.subscriberId);
      const subB = subscribers.find(s => s.id === b.subscriberId);
      return (subA?.customerNo || 0) - (subB?.customerNo || 0);
    });
  }, [payments, filterStartDate, filterEndDate, selectedArea, selectedMethod, subscribers]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e || !e.date) return false;
      const d = new Date(e.date);
      return d >= filterStartDate && d <= filterEndDate;
    });
  }, [expenses, filterStartDate, filterEndDate]);

  const monthNameLong = useMemo(() => {
    const start = filterStartDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const end = filterEndDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return start === end ? start : `${start} — ${end}`;
  }, [filterStartDate, filterEndDate]);

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
          "Serial No": sub?.customerNo || idx + 1,
          "Date": formatDate(p.date),
          "Subscriber Name": sub?.name || 'Unknown',
          [customerIdLabel]: sub?.customerId || '—',
          "Phone Number": sub?.phone || '—',
          "Area/Address": sub?.area || '—',
          "Plan Details": sub?.planId || '—',
          "Payment Method": p.method,
          "Amount Paid": Number(p.amount) || 0,
          "Transaction ID": p.id.slice(-8).toUpperCase()
        };
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(collectionData);
      
      // Auto-size columns
      const colWidths = Object.keys(collectionData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...collectionData.map(row => String(row[key as keyof typeof row]).length)) + 2
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Collection Details");
      XLSX.writeFile(wb, `Collection_Report_${monthNameLong.replace(/ /g, '_')}.xlsx`);
      toast.success("Excel file exported");
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
      toast.success("PDF report downloaded");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-indigo-400">
            <Shield className="h-3.5 w-3.5" />
            Financial performance
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Reports & audit</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="h-9 rounded-lg border-slate-700 bg-slate-900/60 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800">
            <Eye className="mr-2 h-3.5 w-3.5" /> Preview
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="h-9 rounded-lg border-emerald-600/30 bg-emerald-600/10 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-600/20">
            <Download className="mr-2 h-3.5 w-3.5" /> Export Excel
          </Button>
          <Button onClick={handleDownloadPremiumReport} disabled={isGenerating} className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700">
            {isGenerating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-1 p-1 bg-slate-900 border border-white/10 rounded-lg">
          <span className="text-[9px] uppercase font-bold text-slate-500 px-2 my-auto">From</span>
          <select value={months[filterStartDate.getMonth()]} onChange={(e) => {
            const monthIndex = months.indexOf(e.target.value);
            const d = new Date(filterStartDate);
            d.setMonth(monthIndex);
            setFilterStartDate(d);
          }} className="flex-1 h-9 bg-transparent border-none text-sm text-white outline-none appearance-none px-2">
            {months.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>
          <div className="w-px h-4 my-auto bg-white/10" />
          <select value={filterStartDate.getFullYear()} onChange={(e) => {
            const d = new Date(filterStartDate);
            d.setFullYear(Number(e.target.value));
            setFilterStartDate(d);
          }} className="w-16 h-9 bg-transparent border-none text-sm text-white outline-none appearance-none px-2">
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
          </select>
        </div>
        <div className="flex gap-1 p-1 bg-slate-900 border border-white/10 rounded-lg">
          <span className="text-[9px] uppercase font-bold text-slate-500 px-2 my-auto">To</span>
          <select value={months[filterEndDate.getMonth()]} onChange={(e) => {
            const monthIndex = months.indexOf(e.target.value);
            const d = new Date(filterEndDate);
            d.setMonth(monthIndex + 1);
            d.setDate(0);
            d.setHours(23, 59, 59, 999);
            setFilterEndDate(d);
          }} className="flex-1 h-9 bg-transparent border-none text-sm text-white outline-none appearance-none px-2">
            {months.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>
          <div className="w-px h-4 my-auto bg-white/10" />
          <select value={filterEndDate.getFullYear()} onChange={(e) => {
            const d = new Date(filterEndDate);
            d.setFullYear(Number(e.target.value));
            setFilterEndDate(d);
          }} className="w-16 h-9 bg-transparent border-none text-sm text-white outline-none appearance-none px-2">
            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
          </select>
        </div>
        <div className="relative group">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-white/10 bg-slate-900 pl-9 pr-6 text-sm font-medium text-white transition-colors focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {areas.map(area => (
              <option key={area} value={area} className="bg-slate-900">{area}</option>
            ))}
          </select>
        </div>
        <div className="relative group">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600 group-focus-within:text-indigo-500 transition-colors" />
          <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-white/10 bg-slate-900 pl-9 pr-6 text-sm font-medium text-white transition-colors focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="All Methods" className="bg-slate-900">All Methods</option>
            <option value="Cash" className="bg-slate-900">Cash</option>
            <option value="UPI" className="bg-slate-900">UPI / Digital</option>
          </select>
        </div>
      </div>

      {/* STATS INFRASTRUCTURE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Data quality", value: `${(integrityScore * 100).toFixed(1)}%`, icon: ShieldCheck, color: "blue" },
          { label: "Net revenue", value: formatCurrency(monthStats.revenue), icon: TrendingUp, color: "blue" },
          { label: "Outstanding dues", value: formatCurrency(stats.pendingDues), icon: AlertCircle, color: "rose" },
          { label: "Active subscribers", value: stats.active, icon: Users, color: "indigo" }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 rounded-xl border border-white/10 group p-5 transition-colors hover:border-indigo-500/25">
            <div className="mb-3 flex items-center justify-between">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", 
                item.color === "blue" ? "bg-indigo-600/10 text-indigo-400 border-indigo-600/20" : 
                item.color === "rose" ? "bg-rose-600/10 text-rose-400 border-rose-600/20" : 
                "bg-emerald-600/10 text-emerald-300 border-emerald-600/20"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-right text-xs font-medium text-slate-500">{item.label}</span>
            </div>
            <p className="font-display text-xl font-semibold tabular-nums leading-none tracking-tight text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* DUAL LEDGER PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "Collection Ledger", icon: Receipt, data: filteredPayments, type: "collection" },
          { title: "Expenditure Ledger", icon: BarChart3, data: filteredExpenses, type: "expense" }
        ].map((ledger, idx) => (
          <div key={idx} className="bg-slate-900 rounded-xl border border-white/10 flex h-[500px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/40 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ledger.icon className="h-4 w-4 text-indigo-400" />
                {ledger.title}
              </h3>
              <span className="rounded-md border border-white/10 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">{ledger.data.length} rows</span>
            </div>
            <div className="custom-scrollbar flex-1 overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm">
                  <tr>
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">{ledger.type === "collection" ? "Subscriber" : "Category"}</th>
                    <th className="px-5 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ledger.data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-indigo-600/[0.03] transition-colors group">
                      <td className="px-5 py-2.5">
                        {ledger.type === "collection" ? (
                          <>
                            <p className="text-sm font-medium text-white transition-colors group-hover:text-indigo-300">{subscribers.find(s => s.id === item.subscriberId)?.name || "Unknown"}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{subscribers.find(s => s.id === item.subscriberId)?.area || "—"}</p>
                          </>
                        ) : (
                          <>
                            <span className="rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-xs font-medium text-indigo-400">{item.category}</span>
                            <p className="mt-1 max-w-[140px] truncate text-xs text-slate-500">{item.description}</p>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs font-medium text-slate-500">{formatDate(item.date)}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <span className="font-mono text-sm font-semibold text-white">{formatCurrency(item.amount)}</span>
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
                <div className="h-10 w-10 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20 shadow-lg shadow-indigo-600/10">
                  <Eye className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Report preview</h2>
                  <p className="text-sm font-medium text-indigo-400">{monthNameLong}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="h-10 rounded-lg px-5 text-sm font-medium text-slate-400 hover:text-white" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleDownloadPremiumReport} disabled={isGenerating} className="h-10 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download PDF
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
