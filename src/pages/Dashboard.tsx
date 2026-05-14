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
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1.5 flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary" />
            {companySettings?.name || 'SITARAM CABLE & BROADBAND'} · HUB
          </p>
          <h1 className="font-display text-4xl font-black tracking-tighter uppercase leading-none text-white">
            Operational <span className="text-primary italic">Overview</span>
          </h1>
          <div className="flex items-center gap-2.5 mt-4 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800 w-fit shadow-inner">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Cycle: <span className="text-white">{months[dashboardDate.getMonth()]} {dashboardDate.getFullYear()}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <Select value={months[dashboardDate.getMonth()]} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[115px] h-9 border-none bg-transparent focus:ring-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 rounded-xl">
                {months.map(m => <SelectItem key={m} value={m} className="text-[10px] font-bold uppercase tracking-wider text-white">{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="w-px h-4 bg-slate-800" />
            <Select value={dashboardDate.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[85px] h-9 border-none bg-transparent focus:ring-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 rounded-xl">
                {years.map(y => <SelectItem key={y} value={y.toString()} className="text-[10px] font-bold uppercase tracking-wider text-white">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" asChild className="bg-primary text-white hover:bg-primary/90 rounded-xl px-5 h-12 font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-primary/20">
            <Link to="/invoices">
              <Wallet className="mr-2 h-4 w-4" /> Payments Console
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Today's Collection" value={formatCurrency(s.collectedToday)} delta="+12.5% vs yesterday" icon={Activity} variant="primary" />
        <StatCard label="Month Revenue" value={formatCurrency(s.monthRevenue)} delta={`${payments.length} transactions`} icon={Activity} variant="accent" />
        <StatCard label="Pending Dues" value={formatCurrency(s.pendingDues)} delta={`${s.expired} total expired`} icon={AlertCircle} variant="warning" />
        <StatCard label="Expenses" value={formatCurrency(s.monthExpenses)} delta={`${expenses.length} records`} icon={FileText} variant="destructive" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1">Control Panel</h2>
          <div className="h-px flex-1 bg-slate-800 ml-6" />
        </div>        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <Link to="/subscribers" className="group bg-slate-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 hover:border-primary/50 hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner border border-white/5">
               <Users className="h-7 w-7" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Registry</span>
          </Link>

          <Link to="/invoices" className="group bg-slate-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-inner border border-white/5">
               <Wallet className="h-7 w-7" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Invoicing</span>
          </Link>

          <Link to="/reports" className="group bg-slate-900/50 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center gap-4">
             <div className="h-14 w-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-inner border border-white/5">
               <BarChart3 className="h-7 w-7" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Intelligence</span>
          </Link>

          <Button 
            variant="ghost" 
            onClick={handleDownloadReport}
            className="group bg-slate-900/50 backdrop-blur-xl p-6 h-auto rounded-[2rem] border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-300 flex flex-col items-center justify-center gap-4"
          >
             <div className="h-14 w-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-inner border border-white/5">
               {isGenerating ? <Loader2 className="h-7 w-7 animate-spin" /> : <Download className="h-7 w-7" />}
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Export PDF</span>
          </Button>
        </div>

      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] p-8 lg:col-span-2 border border-slate-800 shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">Recent Collections</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Cashflow Monitoring</p>
            </div>
            <Button variant="outline" size="sm" asChild className="h-10 rounded-xl hover:bg-slate-800 text-[10px] uppercase font-bold tracking-widest border-slate-800 text-white"><Link to="/payments">Registry <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
          <div className="space-y-3">
            {recent.map((p) => {
              const sub = subscribers.find(s => s.id === p.subscriberId);
              return (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-800/50 bg-slate-950/50 hover:bg-slate-950 transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all text-slate-500">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">#{sub?.customerNo || '—'}</span>
                        <p className="text-sm font-black text-white truncate tracking-tight">{sub?.name || 'Unknown User'}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">{p.method} · {formatDate(p.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num font-black text-emerald-500 text-base">+{formatCurrency(p.amount)}</p>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                <Activity className="h-12 w-12 text-slate-400" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">No transactions recorded</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl shadow-black/20">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white mb-6">Sector View</h2>
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {areaBreakdown.map(([area, count]) => (
                <div key={area} className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-2 text-slate-400"><MapPin className="h-3.5 w-3.5 text-slate-600" /> {area}</span>
                    <span className="text-slate-500">{count} subs</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-rose-500/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-rose-500/20 shadow-2xl shadow-black/20">
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-rose-500 flex items-center gap-3 mb-6">
              <AlertCircle className="h-6 w-6" /> Terminating
            </h2>
            <div className="space-y-4">
              {expiring.map((sub) => {
                const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                return (
                  <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-rose-500/20 hover:border-rose-500/40 transition-all shadow-inner">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate tracking-tight">{sub.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate mt-0.5">{sub.area}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${days <= 3 ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-rose-500/20 text-rose-500'}`}>
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


