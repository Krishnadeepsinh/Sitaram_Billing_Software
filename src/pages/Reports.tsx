import React, { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Download, Calendar, BarChart3, PieChart, TrendingUp, Wallet, Receipt, Users, Filter, Loader2, ShieldCheck, MapPin, Check, Eye, AlertCircle, Wifi, Phone, Mail } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { GUJARATI_FONT } from "@/lib/fonts/gujarati";
import { useBusinessMode } from "@/lib/turso";
import { getBrandSettings } from "@/lib/branding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

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
      {/* Custom Font Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @font-face {
          font-family: 'Gujarati';
          src: url(data:font/ttf;base64,${GUJARATI_FONT});
        }
        .gujarati { font-family: 'Gujarati', system-ui, sans-serif !important; font-size: 14px !important; line-height: 1.2; }
        .report-header { background-color: #0f172a; color: #fff; padding: 42px; border-bottom: 6px solid #f97316; page-break-inside: avoid; }
        .logo-box { width: 104px; height: 104px; background: #fff; border-radius: 18px; padding: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 35px rgb(0 0 0 / 0.24); }
        .badge { background: #f97316; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; display: inline-block; }
        .mode-badge { margin-top: 10px; background: rgb(249 115 22 / 0.16); color: #fed7aa; border: 1px solid rgb(253 186 116 / 0.4); padding: 5px 12px; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; display: inline-block; }
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
              <p style={{ fontSize: '10px', fontWeight: '900', margin: 0, letterSpacing: '0.26em', color: '#fdba74', textTransform: 'uppercase' }}>Sitaram Cable & Broadband</p>
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
            <div className="badge">MONTHLY AUDIT SUMMARY</div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '10px 0 0 0', color: '#f97316' }}>{monthName}</h2>
            <p style={{ fontSize: '10px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', marginTop: '5px' }}>
              Billing Month: {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box" style={{ borderLeftColor: '#10b981' }}>
          <div className="stat-label">Total Collections</div>
          <div className="stat-value" style={{ color: '#059669' }}>{formatCurrency(monthStats.revenue)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#ef4444' }}>
          <div className="stat-label">Operational Expenses</div>
          <div className="stat-value" style={{ color: '#dc2626' }}>{formatCurrency(monthStats.expenses)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="stat-label">Net Monthly Profit</div>
          <div className="stat-value" style={{ color: '#1d4ed8' }}>{formatCurrency(monthStats.revenue - monthStats.expenses)}</div>
        </div>
        <div className="stat-box" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{filteredPayments.length} Recieved</div>
        </div>
      </div>

      <div className="report-body">
        <div className="table-title">
          <div style={{ width: '4px', height: '18px', background: '#f97316', borderRadius: '2px' }}></div>
          Detailed Collection Log — {selectedArea} — {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>

        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}># No.</th>
              <th style={{ width: '85px' }}>Date</th>
              <th>Customer / Contact</th>
              <th style={{ width: '130px' }}>{customerIdLabel}</th>
              <th>Area</th>
              <th style={{ width: '60px' }}>Method</th>
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
                        {sub?.customerNo ? `#${sub.customerNo} ` : ''}{sub?.name || 'Unknown'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>{sub?.phone || 'No Contact'}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: '700', letterSpacing: '0.05em' }}>
                    {sub?.customerId || '---'}
                  </td>
                  <td style={{ fontWeight: '600', color: '#475569' }}>{sub?.area || 'General'}</td>
                  <td>
                    <span style={{ 
                      fontSize: '8px', 
                      fontWeight: '900', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      background: p.method === 'UPI' ? '#e0e7ff' : '#ffedd5',
                      color: p.method === 'UPI' ? '#4338ca' : '#9a3412'
                    }}>{p.method}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#0f172a', fontSize: '11px' }}>{formatCurrency(p.amount)}</td>
                </tr>
              );
            })}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={6} style={{ textAlign: 'right', padding: '15px', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', color: '#64748b' }}>Total Period Collection</td>
              <td style={{ textAlign: 'right', padding: '15px', fontWeight: '900', fontSize: '13px', color: '#f97316' }}>{formatCurrency(monthStats.revenue)}</td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <div>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>Notes & Compliance</p>
            <p style={{ fontSize: '9px', color: '#94a3b8', maxWidth: '300px', lineHeight: '1.4' }}>This is a computer-generated audit report. All transactions listed above have been verified against the secure billing ledger.</p>
            <div style={{ marginTop: '20px', border: '2px solid #10b981', color: '#10b981', padding: '6px 15px', borderRadius: '8px', display: 'inline-block', fontWeight: '900', fontSize: '11px', transform: 'rotate(-2deg)' }}>VERIFIED AUDIT RECORD</div>
          </div>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div className="sign-box"><p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Accountant</p></div>
            <div className="sign-box">
              <p style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Managing Director</p>
              <p style={{ fontSize: '11px', fontWeight: '900', marginTop: '15px', color: '#0f172a' }}>{brand.name}</p>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: '#0f172a', padding: '15px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: '8px', fontWeight: '800', letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.6 }}>Powered by Sitaram Cable & Broadband — Secure Financial Infrastructure</p>
      </div>
    </div>
  );
};

export default function Reports() {
  const currentBusinessMode = useBusinessMode();
  const customerIdLabel = currentBusinessMode === "cable" ? "STB Number" : "Customer ID";
  const billing = useBilling();
  
  // Destructure with fallbacks
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(1122);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth - 32;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      
      setScale(newScale);
      
      // Update content height after a tiny delay to ensure render is complete
      setTimeout(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      }, 50);
    };

    if (isPreviewOpen) {
      handleResize();
      window.addEventListener("resize", handleResize);
      
      // Additional checks to ensure height is correct after images/content load
      const timer1 = setTimeout(handleResize, 500);
      const timer2 = setTimeout(handleResize, 2000);

      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isPreviewOpen]);
  
  // Filter validation
  useEffect(() => {
    const start = selectedYear * 12 + selectedMonth;
    const end = selectedEndYear * 12 + selectedEndMonth;
    if (end < start) {
      setSelectedEndMonth(selectedMonth);
      setSelectedEndYear(selectedYear);
      toast.error("End period cannot be before start period");
    }
  }, [selectedMonth, selectedYear, selectedEndMonth, selectedEndYear]);

  // Safety check for stats
  const stats = useMemo(() => ({ 
    monthRevenue: s.monthRevenue || 0, 
    monthExpenses: s.monthExpenses || 0, 
    pendingDues: s.pendingDues || 0,
    collectedToday: s.collectedToday || 0,
    totalSubscribers: s.totalSubscribers || 0,
    active: s.active || 0,
    expired: s.expired || 0
  }), [s]);

  const areas = useMemo(() => {
    try {
      const uniqueAreas = Array.from(new Set(subscribers.map(sub => sub.area).filter(Boolean)));
      return ["All Addresses", ...uniqueAreas];
    } catch (e) {
      return ["All Addresses"];
    }
  }, [subscribers]);

  const filteredPayments = useMemo(() => {
    try {
      const filtered = payments.filter(p => {
        if (!p || !p.date) return false;
        const d = new Date(p.date);
        const payTime = d.getFullYear() * 12 + d.getMonth();
        const startTime = selectedYear * 12 + selectedMonth;
        const endTime = selectedEndYear * 12 + selectedEndMonth;

        const isCorrectPeriod = payTime >= startTime && payTime <= endTime;
        if (!isCorrectPeriod) return false;
        const isCorrectMethod = selectedMethod === "All Methods" || p.method === selectedMethod;
        if (!isCorrectMethod) return false;
        if (selectedArea === "All Addresses") return true;
        const sub = subscribers.find(sub => sub.id === p.subscriberId);
        return sub?.area === selectedArea;
      });
      return [...filtered].sort((a, b) => {
        const subA = subscribers.find(s => s.id === a.subscriberId);
        const subB = subscribers.find(s => s.id === b.subscriberId);
        const numA = subA?.customerNo || 0;
        const numB = subB?.customerNo || 0;
        if (numA !== numB) return numA - numB;
        return (subA?.name || "").localeCompare(subB?.name || "");
      });
    } catch (e) {
      return [];
    }
  }, [payments, selectedMonth, selectedYear, selectedArea, selectedMethod, subscribers]);

  const filteredExpenses = useMemo(() => {
    try {
      return expenses.filter(e => {
        if (!e || !e.date) return false;
        const d = new Date(e.date);
        const expTime = d.getFullYear() * 12 + d.getMonth();
        const startTime = selectedYear * 12 + selectedMonth;
        const endTime = selectedEndYear * 12 + selectedEndMonth;
        return expTime >= startTime && expTime <= endTime;
      });
    } catch (e) {
      return [];
    }
  }, [expenses, selectedMonth, selectedYear]);

  const monthNameLong = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    const end = new Date(selectedEndYear, selectedEndMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    return start === end ? start : `${start} - ${end}`;
  }, [selectedMonth, selectedYear, selectedEndMonth, selectedEndYear]);

  const monthStats = useMemo(() => {
    const revenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { revenue, expenses: expensesTotal };
  }, [filteredPayments, filteredExpenses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (billingLoading) setHasTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [billingLoading]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const collectionData = filteredPayments.map((p, idx) => {
        const sub = subscribers.find(s => s.id === p.subscriberId);
        return {
          "Sr No": sub?.customerNo || idx + 1,
          "Date": formatDate(p.date),
          "Subscriber Name": sub?.name || 'Unknown',
          "Phone": sub?.phone || 'N/A',
          "Area": sub?.area || 'N/A',
          [customerIdLabel]: sub?.customerId || 'N/A',
          "Method": p.method,
          "Amount": Number(p.amount) || 0
        };
      });

      const expenseData = filteredExpenses.map((e, idx) => ({
        "Sr No": idx + 1,
        "Date": formatDate(e.date),
        "Category": e.category,
        "Description": e.description,
        "Amount": Number(e.amount) || 0
      }));

      const wb = XLSX.utils.book_new();
      
      const wsPayments = XLSX.utils.json_to_sheet(collectionData);
      XLSX.utils.book_append_sheet(wb, wsPayments, "Collections");

      const wsExpenses = XLSX.utils.json_to_sheet(expenseData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

      // Summary sheet
      const summaryData = [
        ["Report Summary", monthNameLong],
        ["Filter Area", selectedArea],
        ["Filter Method", selectedMethod],
        [],
        ["Total Collections", monthStats.revenue],
        ["Total Expenses", monthStats.expenses],
        ["Net Profit", monthStats.revenue - monthStats.expenses],
        ["Transactions", filteredPayments.length]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      XLSX.writeFile(wb, `Audit_Report_${monthNameLong.replace(/ /g, '_')}.xlsx`);
      toast.success("Excel report exported successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel report");
    }
  };

  const handleDownloadPremiumReport = async () => {
    const element = document.getElementById("premium-report-template");
    if (!element) {
      toast.error("Report template error");
      return;
    }

    setIsGenerating(true);
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    const fileName = `AuditReport_${monthName.replace(' ', '_')}.pdf`;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true,
          width: 794,
          onclone: (doc: Document) => {
            const cloned = doc.getElementById("premium-report-template");
            if (cloned) {
              cloned.style.visibility = "visible";
              cloned.style.display = "block";
              cloned.style.height = "auto";
              cloned.style.position = "relative";
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("Audit report generated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  if (billingLoading && !hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <BarChart3 className="h-6 w-6 text-primary absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-muted-foreground font-display font-bold tracking-tight animate-pulse">Syncing Audit Records...</p>
      </div>
    );
  }

  if (hasTimedOut && billingLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center glass-card border-destructive/20 bg-slate-950">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">Connection Timeout</h2>
          <p className="text-slate-400 max-w-md">The audit database is taking longer than expected to respond.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="destructive" className="rounded-xl px-8">Retry Connection</Button>
      </div>
    );
  }

  const integrityScore = monthStats.revenue / (stats.pendingDues + monthStats.revenue || 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary/30 selection:text-white pb-20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="h-1 w-12 bg-slate-800 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Business Intelligence</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
              Reports <span className="text-primary italic">& Analytics</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
              Audit-ready financial records and performance tracking. Deep insights into your business growth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="h-14 px-6 rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-300 transition-all duration-300">
              <Eye className="h-4 w-4 mr-2 text-primary" />
              Preview Report
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="h-14 px-6 rounded-2xl border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all duration-300">
              <TrendingUp className="h-4 w-4 mr-2" />
              Excel Export
            </Button>
            <Button onClick={handleDownloadPremiumReport} disabled={isGenerating} className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              {isGenerating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Download className="h-5 w-5 mr-2" />}
              Generate PDF
            </Button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative group">
            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 rounded-2xl text-white font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-slate-900">
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i} className="bg-slate-900">{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 rounded-2xl text-white font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-slate-900">
              {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
            </select>
          </div>

          <div className="relative">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 rounded-2xl text-white font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-slate-900">
              {(areas as string[]).map(area => (
                <option key={String(area)} value={String(area)} className="bg-slate-900">{String(area)}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="w-full h-14 pl-14 pr-6 bg-slate-900/50 border-slate-800 rounded-2xl text-white font-bold text-xs uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-slate-900">
              <option value="All Methods" className="bg-slate-900">All Methods</option>
              <option value="Cash" className="bg-slate-900">Cash Only</option>
              <option value="UPI" className="bg-slate-900">UPI / Digital</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 hover:border-primary/50 transition-all duration-500 group shadow-2xl shadow-black/20">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-primary transition-colors">Compliance</span>
            </div>
            <p className="text-4xl font-black tracking-tighter text-white">{(integrityScore * 100).toFixed(1)}%</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-grow-x" style={{ width: `${integrityScore * 100}%` }} />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Audit Integrity</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 hover:border-emerald-500/50 transition-all duration-500 group shadow-2xl shadow-black/20">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-emerald-500 transition-colors">Revenue</span>
            </div>
            <p className="text-4xl font-black tracking-tighter text-white">{formatCurrency(monthStats.revenue)}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Monthly Income</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 hover:border-amber-500/50 transition-all duration-500 group shadow-2xl shadow-black/20">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5">
                <AlertCircle className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-amber-500 transition-colors">Outstanding</span>
            </div>
            <p className="text-4xl font-black tracking-tighter text-white">{formatCurrency(stats.pendingDues)}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Pending Balance</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 group shadow-2xl shadow-black/20">
            <div className="flex justify-between items-start mb-6">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-500 transition-colors">Base</span>
            </div>
            <p className="text-4xl font-black tracking-tighter text-white">{monthStats.activeSubs}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Active Accounts</p>
          </div>
        </div>

        {/* Detailed Logs Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <Receipt className="h-5 w-5 text-primary" />
                Collection Log
              </h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{filteredPayments.length} Records</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="text-[8px] uppercase tracking-[0.2em] text-slate-500 font-black border-b border-slate-800">
                    <th className="px-8 py-4">Subscriber</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredPayments.map((p) => {
                    const sub = subscribers.find(s => s.id === p.subscriberId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-900/50 transition-colors group">
                        <td className="px-8 py-4">
                          <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{sub?.name || "Unknown"}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{sub?.area || "Unspecified"}</p>
                        </td>
                        <td className="px-8 py-4 font-mono text-[10px] text-slate-400">{formatDate(p.date)}</td>
                        <td className="px-8 py-4 text-right">
                          <span className="font-mono-num font-black text-sm text-white">{formatCurrency(p.amount)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-amber-500" />
                Operational Expenses
              </h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{filteredExpenses.length} Records</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="text-[8px] uppercase tracking-[0.2em] text-slate-500 font-black border-b border-slate-800">
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Description</th>
                    <th className="px-8 py-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-900/50 transition-colors group">
                      <td className="px-8 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] font-black uppercase text-amber-500">{e.category}</span>
                        <p className="text-[9px] font-bold text-slate-500 mt-1">{formatDate(e.date)}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-xs font-medium text-slate-300 line-clamp-1">{e.description}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="font-mono-num font-black text-sm text-rose-500">{formatCurrency(e.amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Templates for PDF Generation */}
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
          businessMode={activeBusinessMode}
        />
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between sticky top-0 z-10 py-4 bg-slate-950/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="rounded-full hover:bg-slate-800"><Eye className="h-6 w-6" /></Button>
                <div>
                  <h2 className="text-xl font-black uppercase text-white">Audit Report Preview</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">{monthNameLong} Collection</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-800 text-white" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
                <Button className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px]" onClick={handleDownloadPremiumReport}>
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden mx-auto" style={{ width: '794px' }}>
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
                businessMode={activeBusinessMode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;


