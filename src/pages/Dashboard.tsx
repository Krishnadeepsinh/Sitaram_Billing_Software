import { StatCard } from "@/components/StatCard";
import { 
  Wallet, Users, AlertCircle, Activity, ArrowUpRight, 
  FileText, Download, MapPin, Loader2, Calendar, 
  BarChart3, LayoutGrid, Terminal, ShieldCheck,
  TrendingUp, DatabaseZap, Zap, Globe, Shield,
  Cpu, Network, Signal, ArrowDownLeft
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { useBusinessMode } from "@/lib/turso";
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
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate 
  } = useBilling();
  const [isGenerating, setIsGenerating] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => 2023 + i);

  const handleStartMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    const newDate = new Date(filterStartDate);
    newDate.setMonth(monthIndex);
    setFilterStartDate(newDate);
  };

  const handleStartYearChange = (year: string) => {
    const newDate = new Date(filterStartDate);
    newDate.setFullYear(parseInt(year));
    setFilterStartDate(newDate);
  };

  const handleEndMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    const newDate = new Date(filterEndDate);
    newDate.setMonth(monthIndex);
    // Set to last day of that month
    newDate.setMonth(monthIndex + 1);
    newDate.setDate(0);
    newDate.setHours(23, 59, 59, 999);
    setFilterEndDate(newDate);
  };

  const handleEndYearChange = (year: string) => {
    const newDate = new Date(filterEndDate);
    newDate.setFullYear(parseInt(year));
    setFilterEndDate(newDate);
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

  const businessMode = useBusinessMode();

  return (
    <div className="space-y-6 pb-20">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border animate-in fade-in zoom-in duration-300",
              businessMode === "cable" 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            )}>
              {businessMode} Mode
            </div>
          </div>
          <p className="text-sm text-slate-400">Overview of your operations and revenue.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900 p-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2">From</span>
              <Select value={months[filterStartDate.getMonth()]} onValueChange={handleStartMonthChange}>
                <SelectTrigger className="h-8 w-[110px] border-none bg-transparent text-xs font-medium text-white focus:ring-0 px-2">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900">
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStartDate.getFullYear().toString()} onValueChange={handleStartYearChange}>
                <SelectTrigger className="h-8 w-[70px] border-none bg-transparent text-xs font-medium text-white focus:ring-0 px-2">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900">
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900 p-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2">To</span>
              <Select value={months[filterEndDate.getMonth()]} onValueChange={handleEndMonthChange}>
                <SelectTrigger className="h-8 w-[110px] border-none bg-transparent text-xs font-medium text-white focus:ring-0 px-2">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900">
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterEndDate.getFullYear().toString()} onValueChange={handleEndYearChange}>
                <SelectTrigger className="h-8 w-[70px] border-none bg-transparent text-xs font-medium text-white focus:ring-0 px-2">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-900">
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleDownloadReport}
            disabled={isGenerating}
            className="h-11 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors px-6"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
        {[
          { label: "New Payment", icon: Wallet, to: "/payments", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Subscribers", icon: Users, to: "/subscribers", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
          { label: "Billing", icon: FileText, to: "/invoices", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Reports", icon: BarChart3, to: "/reports", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" }
        ].map((action, i) => (
          <Link key={i} to={action.to} className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border p-6 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95", action.bg, action.border)}>
            <action.icon className={cn("h-8 w-8", action.color)} />
            <span className={cn("text-sm font-semibold tracking-wide", action.color)}>{action.label}</span>
          </Link>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Collection", value: formatCurrency(s.collectedToday), icon: TrendingUp, delta: "+18.2%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Monthly Revenue", value: formatCurrency(s.monthRevenue), icon: DatabaseZap, delta: "Stable", color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Pending Dues", value: formatCurrency(s.pendingDues), icon: AlertCircle, delta: "Action Required", color: "text-rose-400", bg: "bg-rose-500/10" },
          { label: "Monthly Expenses", value: formatCurrency(s.monthExpenses), icon: FileText, delta: "Standard", color: "text-slate-400", bg: "bg-slate-500/10" }
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-slate-900 p-6 shadow-sm hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-lg", kpi.bg, kpi.color)}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <span className={cn("text-xs font-medium px-2 py-1 rounded-md bg-slate-800 border border-white/5", kpi.color)}>
                {kpi.delta}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-white tabular-nums">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <Button variant="ghost" asChild className="text-sm text-indigo-400 hover:text-indigo-300">
              <Link to="/payments">View All <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900 overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent transactions</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recent.map((p) => {
                  const sub = subscribers.find(s => s.id === p.subscriberId);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">{sub?.name || "Unknown Subscriber"}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Signal className="h-3 w-3" /> {p.method}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(p.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-emerald-400 tabular-nums">+{formatCurrency(p.amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Global Widgets */}
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-400" /> Area Breakdown
            </h3>
            <div className="space-y-4">
              {areaBreakdown.slice(0, 5).map(([area, count]) => (
                <div key={area} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">{area}</span>
                    <span className="text-slate-400">{count} subs</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400" /> Expiring Soon
            </h3>
            <div className="space-y-3">
              {expiring.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming expirations</p>
              ) : (
                expiring.map((sub) => {
                  const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-slate-800/50">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-white truncate">{sub.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{sub.area}</p>
                      </div>
                      <div className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums border",
                        days <= 3 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-800 text-slate-400 border-white/5"
                      )}>
                        {days} {days === 1 ? 'day' : 'days'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button variant="ghost" asChild className="w-full mt-4 text-sm text-indigo-400 hover:text-indigo-300">
              <Link to="/subscribers">View All <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
