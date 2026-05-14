import { StatCard } from "@/components/StatCard";
import { Wallet, Users, AlertCircle, Activity, ArrowUpRight, FileText, Download, MapPin, Loader2, Calendar, BarChart3 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { useBilling } from "@/context/BillingContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { 
    stats: s, 
    payments, 
    subscribers, 
    expenses, 
    plans: plansList, 
    isLoading, 
    companySettings,
    dashboardDate,
    setDashboardDate 
  } = useBilling();
  const [isGenerating, setIsGenerating] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => 2023 + i);

  const handleMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    const newDate = new Date(dashboardDate);
    newDate.setMonth(monthIndex);
    setDashboardDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(dashboardDate);
    newDate.setFullYear(parseInt(year));
    setDashboardDate(newDate);
  };

  const recent = [...payments].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);
  const expiring = subscribers
    .filter((x) => x.status === "active")
    .sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate))
    .slice(0, 4);

  const areaBreakdown = Object.entries(
    subscribers.reduce((acc, sub) => {
      acc[sub.area] = (acc[sub.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const now = new Date();
      
      const formatCurrencyPDF = (n: any) => {
        const val = Number(n) || 0;
        return "Rs. " + val.toLocaleString('en-IN');
      };

      doc.setFontSize(22);
      doc.text(companySettings?.name || 'SITARAM CABLE & BROADBAND operations', 20, 20);
      doc.setFontSize(10);
      doc.text(`Operational Intelligence Report - ${formatDate(now.toISOString())}`, 20, 30);
      
      doc.setFontSize(16);
      doc.text('Key Performance Indicators', 20, 50);
      doc.setFontSize(12);
      doc.text(`Today's Collection: ${formatCurrencyPDF(s.collectedToday)}`, 20, 65);
      doc.text(`Monthly Revenue: ${formatCurrencyPDF(s.monthRevenue)}`, 20, 75);
      doc.text(`Total Pending Dues: ${formatCurrencyPDF(s.pendingDues)}`, 20, 85);
      doc.text(`Active Subscriber Base: ${s.totalSubscribers}`, 20, 95);
      
      let y = 120;
      doc.setFontSize(16);
      doc.text('Sector Breakdown', 20, y);
      doc.setFontSize(10);
      y += 15;
      areaBreakdown.forEach(([area, count]) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${area}: ${count} subscribers`, 25, y);
        y += 10;
      });

      // Detailed Transaction History
      y += 10;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.text('Recent Transaction History', 20, y);
      y += 15;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Date', 20, y);
      doc.text('Subscriber', 50, y);
      doc.text('Method', 100, y);
      doc.text('Period', 130, y);
      doc.text('Amount', 180, y, { align: 'right' });
      doc.setFont(undefined, 'normal');
      y += 5;
      doc.line(20, y, 190, y);
      y += 10;

      const reportPayments = [...payments].sort((a,b) => +new Date(b.date) - +new Date(a.date)).slice(0, 50);
      reportPayments.forEach(p => {
        if (y > 275) { doc.addPage(); y = 20; }
        const sub = subscribers.find(s => s.id === p.subscriberId);
        const plan = plansList.find(pl => pl.id === sub?.planId) || { price: 200 };
        const numMonths = Math.max(1, Math.round(p.amount / plan.price));
        
        doc.text(formatDate(p.date), 20, y);
        doc.text(sub?.name?.slice(0, 20) || 'Unknown', 50, y);
        doc.text(p.method, 100, y);
        doc.text(`${numMonths}M`, 130, y);
        doc.text(formatCurrencyPDF(p.amount), 180, y, { align: 'right' });
        y += 8;
      });

      const fileName = `Operations_Report_${now.toISOString().split('T')[0]}.pdf`;
      const blob = doc.output('blob');

      const saveAs = (await import('file-saver')).saveAs;
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success("Report opened in new tab");
      } else {
        saveAs(blob, fileName);
        toast.success("Report exported as PDF!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF report.");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="app-eyebrow mb-1 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            {companySettings?.name || "Sitaram Cable & Broadband"}
          </p>
          <h1 className="app-page-title">
            Dashboard <span className="text-blue-400">overview</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-slate-800/90 bg-slate-900/50 p-1 shadow-inner">
            <Select value={months[dashboardDate.getMonth()]} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 w-[100px] border-none bg-transparent text-xs font-medium text-slate-200 focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-slate-800 bg-slate-900">
                {months.map(m => <SelectItem key={m} value={m} className="text-sm text-slate-100">{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-slate-800" />
            <Select value={dashboardDate.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[72px] border-none bg-transparent text-xs font-medium text-slate-200 focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-slate-800 bg-slate-900">
                {years.map(y => <SelectItem key={y} value={y.toString()} className="text-sm text-slate-100">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" asChild className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-500">
            <Link to="/invoices">
              <Wallet className="mr-2 h-4 w-4" /> Open invoices
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Today's Collection" value={formatCurrency(s.collectedToday)} delta="+12.5% vs yesterday" icon={Activity} variant="primary" />
        <StatCard label="Month Revenue" value={formatCurrency(s.monthRevenue)} delta={`${payments.length} txn`} icon={Activity} variant="primary" />
        <StatCard label="Pending Dues" value={formatCurrency(s.pendingDues)} delta={`${s.expired} expired`} icon={AlertCircle} variant="warning" />
        <StatCard label="Expenses" value={formatCurrency(s.monthExpenses)} delta={`${expenses.length} logs`} icon={FileText} variant="destructive" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shortcuts</h2>
          <div className="ml-4 h-px flex-1 bg-slate-800/60" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Link to="/subscribers" className="app-panel group flex flex-col items-center justify-center gap-2.5 p-4 transition-colors hover:border-blue-500/30">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80 text-slate-400 shadow-inner transition-all group-hover:scale-105 group-hover:border-blue-500/40 group-hover:bg-blue-600 group-hover:text-white">
               <Users className="h-5 w-5" />
             </div>
             <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-white">Subscribers</span>
          </Link>

          <Link to="/invoices" className="app-panel group flex flex-col items-center justify-center gap-2.5 p-4 transition-colors hover:border-blue-500/30">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80 text-slate-400 shadow-inner transition-all group-hover:scale-105 group-hover:border-blue-500/40 group-hover:bg-blue-600 group-hover:text-white">
               <Wallet className="h-5 w-5" />
             </div>
             <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-white">Invoices</span>
          </Link>

          <Link to="/reports" className="app-panel group flex flex-col items-center justify-center gap-2.5 p-4 transition-colors hover:border-blue-500/30">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80 text-slate-400 shadow-inner transition-all group-hover:scale-105 group-hover:border-blue-500/40 group-hover:bg-blue-600 group-hover:text-white">
               <BarChart3 className="h-5 w-5" />
             </div>
             <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-white">Reports</span>
          </Link>

          <Button 
            variant="ghost" 
            onClick={handleDownloadReport}
            className="app-panel group flex h-auto flex-col items-center justify-center gap-2.5 p-4 transition-colors hover:border-blue-500/30"
          >
             <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80 text-slate-400 shadow-inner transition-all group-hover:scale-105 group-hover:border-blue-500/40 group-hover:bg-blue-600 group-hover:text-white">
               {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
             </div>
             <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-white">Export PDF</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="app-panel overflow-hidden p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-white">Recent collections</h2>
              <p className="mt-0.5 text-xs text-slate-500">Latest payments</p>
            </div>
            <Button variant="outline" size="sm" asChild className="h-8 border-slate-700 bg-slate-900/60 text-xs font-medium text-slate-300 hover:bg-slate-800">
              <Link to="/payments">All payments <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 text-blue-400" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {recent.map((p) => {
              const sub = subscribers.find(s => s.id === p.subscriberId);
              return (
                <div key={p.id} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-800/50 bg-slate-950/30 p-2.5 transition-colors hover:border-slate-700 hover:bg-slate-900/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500 transition-colors group-hover:border-blue-500/40 group-hover:bg-blue-600 group-hover:text-white">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-blue-500/25 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">#{sub?.customerNo || "—"}</span>
                        <p className="truncate text-sm font-medium text-white">{sub?.name || "Unknown"}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{p.method} · {formatDate(p.date)}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold text-blue-400">+{formatCurrency(p.amount)}</p>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
                <Activity className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No payments yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="app-panel p-5">
            <h2 className="font-display mb-4 text-base font-semibold text-white">By area</h2>
            <div className="custom-scrollbar max-h-[250px] space-y-4 overflow-y-auto pr-1">
              {areaBreakdown.map(([area, count]) => (
                <div key={area} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-400"><MapPin className="h-3.5 w-3.5 text-slate-600" /> {area}</span>
                    <span className="text-slate-500">{count} subscribers</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-800/60 bg-slate-950">
                    <div 
                      className="h-full rounded-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-5 shadow-lg shadow-black/20 backdrop-blur-xl">
            <h2 className="font-display mb-4 flex items-center gap-2 text-base font-semibold text-blue-300">
              <AlertCircle className="h-4 w-4" /> Expiring soon
            </h2>
            <div className="space-y-2">
              {expiring.map((sub) => {
                const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                return (
                  <div key={sub.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800/60 bg-slate-950/40 p-2.5 transition-colors hover:border-blue-500/25">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{sub.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{sub.area}</p>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-medium ${days <= 3 ? "border-blue-500/30 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-slate-900 text-slate-400"}`}>
                      {days}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


