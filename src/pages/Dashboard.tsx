import { StatCard } from "@/components/StatCard";
import { 
  Wallet, Users, AlertCircle, Activity, ArrowUpRight, 
  FileText, Download, MapPin, Loader2, Calendar, 
  BarChart3, LayoutGrid, Terminal, ShieldCheck,
  TrendingUp, DatabaseZap, Zap, Globe, Shield,
  Cpu, Network, Signal, ArrowDownLeft
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    .slice(0, 8);

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
      doc.text(companySettings?.name || 'SITARAM CABLE & BROADBAND', 20, 20);
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

      const fileName = `Ops_Report_${now.toISOString().split('T')[0]}.pdf`;
      const blob = doc.output('blob');
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(blob, fileName);
      toast.success("Operational Report Exported");
    } catch (err) {
      toast.error("Export Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-10 pointer-events-none">
        <Network className="h-[400px] w-[400px] text-blue-500 blur-3xl" />
      </div>

      {/* Industrial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-b border-white/5 pb-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 w-fit backdrop-blur-3xl shadow-xl shadow-blue-600/5">
            <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Hub Command: Active</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
            Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800">Intelligence</span>
          </h1>
          <p className="text-sm font-black text-slate-500 tracking-[0.2em] uppercase flex items-center gap-3">
            <Globe className="h-4 w-4" /> Operational Matrix & Global Yield Analytics
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-2 backdrop-blur-3xl shadow-2xl">
            <Select value={months[dashboardDate.getMonth()]} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-10 w-[130px] border-none bg-transparent text-[11px] font-black uppercase tracking-widest text-white focus:ring-0">
                <Calendar className="mr-2 h-3.5 w-3.5 text-blue-500" />
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-3xl">
                {months.map(m => <SelectItem key={m} value={m} className="text-[11px] font-black uppercase tracking-widest text-slate-100">{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="h-6 w-px bg-white/10" />
            <Select value={dashboardDate.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="h-10 w-[90px] border-none bg-transparent text-[11px] font-black uppercase tracking-widest text-white focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-3xl">
                {years.map(y => <SelectItem key={y} value={y.toString()} className="text-[11px] font-black uppercase tracking-widest text-slate-100">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleDownloadReport}
            disabled={isGenerating}
            className="h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] px-8 hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 border border-blue-400/20"
          >
            {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
            Export Intelligence
          </Button>
        </div>
      </div>

      {/* Massive KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
        {[
          { label: "Intake_Today", value: formatCurrency(s.collectedToday), icon: TrendingUp, delta: "+18.2%", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Gross_Matrix", value: formatCurrency(s.monthRevenue), icon: DatabaseZap, delta: "Stable", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Pending_Yield", value: formatCurrency(s.pendingDues), icon: AlertCircle, delta: "Action Required", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "System_Burn", value: formatCurrency(s.monthExpenses), icon: FileText, delta: "Standard", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" }
        ].map((kpi, i) => (
          <div key={i} className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/30 backdrop-blur-3xl p-8 hover:border-white/10 transition-all duration-500 shadow-2xl">
            <div className={cn("absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-20", kpi.bg)} />
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-2xl bg-slate-950 border shadow-inner", kpi.border, kpi.color)}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl bg-white/5 border border-white/5", kpi.color)}>
                {kpi.delta}
              </span>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 italic">{kpi.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tighter italic tabular-nums">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Live Transaction Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="app-panel border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group rounded-[3rem]">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]">
              <Cpu className="h-64 w-64 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between p-10 border-b border-white/5 bg-slate-950/30">
              <div className="flex items-center gap-6">
                <div className="h-14 w-2 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Live Billing Feed</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Real-time Node Ledger Updates</p>
                </div>
              </div>
              <Button variant="ghost" asChild className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white hover:bg-blue-600/10 border border-blue-500/10 transition-all">
                <Link to="/payments">Enter Audit Mode <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="p-8 space-y-4">
              {recent.map((p) => {
                const sub = subscribers.find(s => s.id === p.subscriberId);
                return (
                  <div key={p.id} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 p-6 hover:border-blue-500/40 hover:bg-slate-950 transition-all duration-500 shadow-inner">
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:border-blue-400 group-hover:text-white transition-all duration-500">
                          <Wallet className="h-7 w-7 text-slate-600 group-hover:text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-[10px] font-black uppercase bg-blue-600/10 text-blue-500 px-2 py-0.5 rounded-lg border border-blue-600/20 italic tracking-widest">NODE_{sub?.customerNo || "X"}</span>
                            <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight italic">{sub?.name || "RECOVERY_DATA"}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                            <span className="flex items-center gap-1.5 text-slate-400"><Signal className="h-3 w-3 text-blue-500" /> {p.method}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/5" />
                            <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(p.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-blue-400 tracking-tighter italic tabular-nums">+{formatCurrency(p.amount)}</p>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <ShieldCheck className="h-4 w-4 text-blue-500/40" />
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">SECURE_TX</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Widgets */}
        <div className="lg:col-span-4 space-y-8">
          <div className="app-panel p-8 border border-white/5 bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-[0.03]">
              <Globe className="h-40 w-40 text-blue-500" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600 mb-8 italic flex items-center gap-3">
              <MapPin className="h-4 w-4 text-blue-500" /> Regional Penetration
            </h3>
            <div className="space-y-6">
              {areaBreakdown.slice(0, 5).map(([area, count]) => (
                <div key={area} className="space-y-3 group/item">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-400 group-hover/item:text-blue-400 transition-colors">{area}</span>
                    <span className="text-white italic tracking-widest">{count} NODES</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000 group-hover/item:scale-x-105 origin-left" 
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-b from-blue-600/20 to-transparent rounded-[3.5rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="app-panel p-8 border border-blue-500/10 bg-blue-600/[0.03] backdrop-blur-3xl relative overflow-hidden rounded-[3rem] shadow-2xl">
              <div className="absolute -top-6 -right-6 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <AlertCircle className="h-20 w-20 text-blue-400" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 flex items-center gap-3 italic">
                <Activity className="h-5 w-5 animate-pulse" /> Lifecycle Alerts
              </h3>
              <div className="space-y-4">
                {expiring.map((sub) => {
                  const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-blue-500/30 hover:bg-slate-950 transition-all duration-300 group/item shadow-inner">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-black text-white uppercase tracking-tight truncate italic group-hover/item:text-blue-400 transition-colors">{sub.name}</p>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">{sub.area}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border italic tabular-nums shadow-2xl transition-all",
                        days <= 3 ? "bg-blue-600 text-white border-blue-400 shadow-blue-600/40" : "bg-slate-900 text-slate-500 border-white/5"
                      )}>
                        {days}D_REM
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" asChild className="w-full mt-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 hover:bg-blue-600/10 hover:text-white border border-blue-500/10 transition-all italic">
                <Link to="/subscribers">All Node Lifecycles <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
