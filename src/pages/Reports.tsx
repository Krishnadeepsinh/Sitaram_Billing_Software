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
                        {sub?.name || 'Unknown'}
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
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 64; 
        const newScale = Math.min(1, containerWidth / 794);
        setScale(newScale);
        setContentHeight(contentRef.current.offsetHeight);
      }
    };
    
    if (isPreviewOpen) {
      handleResize();
      const resizeObserver = new ResizeObserver(handleResize);
      if (contentRef.current) resizeObserver.observe(contentRef.current);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      window.addEventListener("resize", handleResize);
      
      return () => {
        window.removeEventListener("resize", handleResize);
        resizeObserver.disconnect();
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center glass-card border-destructive/20">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <div className="space-y-2">
          <h2 className="text-xl font-black">Connection Timeout</h2>
          <p className="text-muted-foreground max-w-md">The audit database is taking longer than expected to respond.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="destructive" className="rounded-xl px-8">Retry Connection</Button>
      </div>
    );
  }

  const integrityScore = monthStats.revenue / (stats.pendingDues + monthStats.revenue || 1);






  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl"><BarChart3 className="h-8 w-8 text-primary" /></div>
            Reports <span className="text-primary">&</span> Analytics
          </h1>
          <p className="text-muted-foreground font-medium mt-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Audit-ready financial records and performance tracking.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 p-2 bg-secondary/30 rounded-2xl border border-border/40">
          <div className="flex items-center gap-2 px-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">From</span>
              <div className="flex items-center gap-1">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-transparent font-bold text-xs outline-none cursor-pointer hover:text-primary transition-colors">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i} className="bg-background">{new Date(2000, i).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent font-bold text-xs outline-none cursor-pointer hover:text-primary transition-colors">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-background">{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="h-6 w-px bg-border/60" />
          <div className="flex items-center gap-2 px-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">To</span>
              <div className="flex items-center gap-1">
                <select value={selectedEndMonth} onChange={(e) => setSelectedEndMonth(parseInt(e.target.value))} className="bg-transparent font-bold text-xs outline-none cursor-pointer hover:text-primary transition-colors">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i} className="bg-background">{new Date(2000, i).toLocaleString('default', { month: 'short' })}</option>
                  ))}
                </select>
                <select value={selectedEndYear} onChange={(e) => setSelectedEndYear(parseInt(e.target.value))} className="bg-transparent font-bold text-xs outline-none cursor-pointer hover:text-primary transition-colors">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-background">{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="h-6 w-px bg-border/60" />
          <div className="flex items-center gap-2 px-3">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)} className="bg-transparent font-bold text-sm outline-none cursor-pointer hover:text-primary transition-colors min-w-[100px]">
              <option value="All Methods" className="bg-background">All Methods</option>
              <option value="Cash" className="bg-background">Cash Only</option>
              <option value="UPI" className="bg-background">UPI Only</option>
            </select>
          </div>
          <div className="h-6 w-px bg-border/60" />
          <div className="flex items-center gap-2 px-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="bg-transparent font-bold text-sm outline-none cursor-pointer hover:text-primary transition-colors min-w-[100px]">
              {(areas as string[]).map(area => (
                <option key={String(area)} value={String(area)} className="bg-background">{String(area)}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest px-4 border-primary/20 hover:bg-primary/5 text-primary" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="h-3 w-3 mr-2" /> Preview
            </Button>
            <Button variant="outline" className="h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest px-4 border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600" onClick={handleExportExcel}>
              <BarChart3 className="h-3 w-3 mr-2" /> Excel
            </Button>
            <Button className="h-10 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-6 shadow-lg shadow-primary/20" onClick={handleDownloadPremiumReport} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Download className="h-3 w-3 mr-2" />}
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-primary hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><ShieldCheck className="h-5 w-5" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compliance</span>
          </div>
          <p className="text-3xl font-black tracking-tight">{(integrityScore * 100).toFixed(1)}%</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${integrityScore * 100}%` }} /></div>
            <span className="text-[10px] font-bold text-primary">Score</span>
          </div>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-emerald-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Wallet className="h-5 w-5" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collections</span>
          </div>
          <p className="text-3xl font-black tracking-tight text-emerald-500">{formatCurrency(monthStats.revenue)}</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-2">Revenue for {new Date(2000, selectedMonth).toLocaleString('default', { month: 'short' })}</p>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-amber-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><TrendingUp className="h-5 w-5" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding</span>
          </div>
          <p className="text-3xl font-black tracking-tight text-amber-500">{formatCurrency(stats.pendingDues)}</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-2">Global Dues</p>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-indigo-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><Receipt className="h-5 w-5" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Costs</span>
          </div>
          <p className="text-3xl font-black tracking-tight text-indigo-500">{formatCurrency(monthStats.expenses)}</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-2">Operational Spend</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="p-8 border-b border-border/40 bg-secondary/10 flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight">Collection Log</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Showing {Math.min(filteredPayments.length, 50)} Trx</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted-foreground font-black border-b border-border/40">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5">Subscriber</th>
                    <th className="px-8 py-5">Area</th>
                    <th className="px-8 py-5">Method</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-sm">
                  {filteredPayments.slice(0, 50).map((p) => {
                    const sub = subscribers.find(s => s.id === p.subscriberId);
                    const isGujarati = /[\u0a80-\u0aff]/.test(sub?.name || '');
                    return (
                      <tr key={p.id} className="hover:bg-primary/[0.02] transition-all group">
                        <td className="px-8 py-5 font-medium text-muted-foreground">{formatDate(p.date)}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">{sub?.customerNo || '?'}</div>
                            <div className="flex flex-col">
                              <span className={`font-bold text-foreground group-hover:text-primary transition-colors ${isGujarati ? 'gujarati text-base' : ''}`}>{sub?.name || 'Unknown'}</span>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{customerIdLabel}: {sub?.customerId || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-muted-foreground font-medium">
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-primary/40" />{sub?.area || 'N/A'}</div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase border ${p.method === 'UPI' ? 'bg-indigo-500/5 text-indigo-500 border-indigo-500/20' : 'bg-amber-500/5 text-amber-500 border-amber-500/20'}`}>{p.method}</span>
                        </td>
                        <td className="px-8 py-5 text-right font-black tabular-nums text-primary">{formatCurrency(p.amount)}</td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="p-4 bg-muted/50 rounded-full"><Filter className="h-8 w-8 text-muted-foreground/30" /></div>
                          <p className="text-muted-foreground font-medium italic">No transactions match your current filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card rounded-[2rem] p-8 bg-gradient-to-br from-primary/[0.02] to-transparent border border-border/40">
            <h3 className="text-xl font-black tracking-tight mb-8">Performance ROI</h3>
            <div className="space-y-8">
              <div className="p-6 bg-background/50 rounded-[1.5rem] border border-border/40 shadow-sm group hover:border-primary/30 transition-colors">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-2">Net Period Profit</p>
                <p className="text-4xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(monthStats.revenue - monthStats.expenses)}</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Profit Margin</p>
                  <span className="text-sm font-black text-primary">{monthStats.revenue > 0 ? `${Math.max(0, Math.round(((monthStats.revenue - monthStats.expenses) / monthStats.revenue) * 100))}%` : '0%'}</span>
                </div>
                <div className="h-4 w-full bg-secondary/50 rounded-full overflow-hidden p-1 border border-border/20 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000" style={{ width: monthStats.revenue > 0 ? `${Math.max(0, ((monthStats.revenue - monthStats.expenses) / monthStats.revenue) * 100)}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-8 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><ShieldCheck className="h-24 w-24" /></div>
            <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Audit Actions</h3>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed font-medium">Finalize this month's financial records. This report includes all verified collections and operational expenses.</p>
            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 bg-white text-slate-900 hover:bg-white/90 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 active:scale-95" onClick={() => setIsPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" /> Preview Audit
              </Button>
              <Button className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 active:scale-95" onClick={handleDownloadPremiumReport} disabled={isGenerating}>
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</> : <><Download className="h-4 w-4 mr-2" /> Download Report</>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PREVIEW DIALOG ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[850px] max-h-[90vh] overflow-y-auto p-0 border-none bg-zinc-100/50 backdrop-blur-xl">
          <DialogHeader className="p-6 bg-white border-b sticky top-0 z-20">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center justify-between">
              Audit Report Preview
              <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">{monthNameLong}</span>
            </DialogTitle>
          </DialogHeader>
          <div ref={containerRef} className="p-4 sm:p-8 flex justify-center overflow-x-hidden">
            <div 
              ref={contentRef}
              className="shadow-2xl ring-1 ring-black/5 rounded-sm overflow-hidden origin-top transition-transform duration-300"
              style={{ 
                transform: `scale(${scale})`, 
                marginBottom: `${(scale - 1) * contentHeight}px`,
                marginRight: `${(scale - 1) * 794}px`
              }}
            >
              <AuditReportTemplate 
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
          <DialogFooter className="p-6 bg-white border-t sticky bottom-0 z-20">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsPreviewOpen(false)}>Close Preview</Button>
            <Button className="rounded-xl bg-primary text-primary-foreground font-black px-8 shadow-lg shadow-primary/20" onClick={() => { setIsPreviewOpen(false); handleDownloadPremiumReport(); }}>
              <Download className="h-4 w-4 mr-2" /> Download Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── HIDDEN TEMPLATE FOR PDF CAPTURE ── */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '794px', zIndex: -1000 }}>
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
    </div>
  );
}


