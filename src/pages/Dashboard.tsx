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
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your operations and revenue.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 px-2">From</span>
              <Select value={months[filterStartDate.getMonth()]} onValueChange={handleStartMonthChange}>
                <SelectTrigger className="h-8 w-[110px] border-none bg-transparent text-xs font-medium text-slate-700 focus:ring-0 px-2">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStartDate.getFullYear().toString()} onValueChange={handleStartYearChange}>
                <SelectTrigger className="h-8 w-[70px] border-none bg-transparent text-xs font-medium text-slate-700 focus:ring-0 px-2">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 px-2">To</span>
              <Select value={months[filterEndDate.getMonth()]} onValueChange={handleEndMonthChange}>
                <SelectTrigger className="h-8 w-[110px] border-none bg-transparent text-xs font-medium text-slate-700 focus:ring-0 px-2">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterEndDate.getFullYear().toString()} onValueChange={handleEndYearChange}>
                <SelectTrigger className="h-8 w-[70px] border-none bg-transparent text-xs font-medium text-slate-700 focus:ring-0 px-2">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white">
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleDownloadReport}
            disabled={isGenerating}
            className="h-10 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors px-5"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Collection", value: formatCurrency(s.collectedToday), icon: TrendingUp, variant: "primary" as const, delta: "Today" },
          { label: "Monthly Revenue", value: formatCurrency(s.monthRevenue), icon: Wallet, variant: "success" as const, delta: "This period" },
          { label: "Pending Dues", value: formatCurrency(s.pendingDues), icon: AlertCircle, variant: "warning" as const, delta: "Action required" },
          { label: "Monthly Expenses", value: formatCurrency(s.monthExpenses), icon: FileText, variant: "destructive" as const, delta: "This period" }
        ].map((kpi, i) => (
          <StatCard key={i} {...kpi} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New Payment", icon: Wallet, to: "/payments", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
          { label: "Subscribers", icon: Users, to: "/subscribers", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Billing", icon: FileText, to: "/invoices", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
          { label: "Reports", icon: BarChart3, to: "/reports", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" }
        ].map((action, i) => (
          <Link key={i} to={action.to} className={cn("flex items-center justify-center gap-2 rounded-xl border p-3 transition-all hover:shadow-sm", action.bg, action.border)}>
            <action.icon className={cn("h-4 w-4", action.color)} />
            <span className={cn("text-sm font-medium", action.color)}>{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Recent Collections</h2>
            <Button variant="ghost" asChild className="text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              <Link to="/payments">View All <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Wallet className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                <p>No recent transactions</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((p) => {
                  const sub = subscribers.find(s => s.id === p.subscriberId);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">{(sub?.name || "?")[0]}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-800">{sub?.name || "Unknown Subscriber"}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", p.method === 'Cash' ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600")}>{p.method}</span>
                            <span>•</span>
                            <span>{formatDate(p.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 font-mono tabular-nums">+{formatCurrency(p.amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" /> Area Breakdown
            </h3>
            <div className="space-y-4">
              {areaBreakdown.slice(0, 5).map(([area, count]) => (
                <div key={area} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">{area}</span>
                    <span className="text-slate-400">{count} subs</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all" 
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Expiring Soon
            </h3>
            <div className="space-y-2">
              {expiring.length === 0 ? (
                <p className="text-sm text-slate-400">No upcoming expirations</p>
              ) : (
                expiring.map((sub) => {
                  const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-slate-700 truncate">{sub.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sub.area}</p>
                      </div>
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums",
                        days <= 3 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {days}d
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Button variant="ghost" asChild className="w-full mt-4 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50">
              <Link to="/subscribers">View All <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
