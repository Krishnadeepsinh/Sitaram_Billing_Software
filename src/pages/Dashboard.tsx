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
    if (newDate > filterEndDate) {
      setFilterStartDate(newDate);
      const end = new Date(newDate);
      end.setMonth(newDate.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      setFilterEndDate(end);
    } else {
      setFilterStartDate(newDate);
    }
  };

  const handleStartYearChange = (year: string) => {
    const newDate = new Date(filterStartDate);
    newDate.setFullYear(parseInt(year));
    if (newDate > filterEndDate) {
      setFilterStartDate(newDate);
      const end = new Date(newDate);
      end.setMonth(newDate.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      setFilterEndDate(end);
    } else {
      setFilterStartDate(newDate);
    }
  };

  const handleEndMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    const newDate = new Date(filterEndDate);
    newDate.setMonth(monthIndex + 1);
    newDate.setDate(0);
    newDate.setHours(23, 59, 59, 999);
    if (newDate < filterStartDate) {
      setFilterEndDate(newDate);
      const start = new Date(newDate);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      setFilterStartDate(start);
    } else {
      setFilterEndDate(newDate);
    }
  };

  const handleEndYearChange = (year: string) => {
    const newDate = new Date(filterEndDate);
    newDate.setFullYear(parseInt(year));
    if (newDate < filterStartDate) {
      setFilterEndDate(newDate);
      const start = new Date(newDate);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      setFilterStartDate(start);
    } else {
      setFilterEndDate(newDate);
    }
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
        return "Rs. " + val.toLocaleString("en-IN");
      };

      doc.setFontSize(22);
      doc.text(companySettings?.name || "SITARAM CABLE & BROADBAND", 20, 20);
      doc.setFontSize(10);
      doc.text(`Operational Intelligence Report - ${formatDate(now.toISOString())}`, 20, 30);

      doc.setFontSize(16);
      doc.text("Key Performance Indicators", 20, 50);
      doc.setFontSize(12);
      doc.text(`Today's Collection: ${formatCurrencyPDF(s.collectedToday)}`, 20, 65);
      doc.text(`Monthly Revenue: ${formatCurrencyPDF(s.monthRevenue)}`, 20, 75);
      doc.text(`Total Pending Dues: ${formatCurrencyPDF(s.pendingDues)}`, 20, 85);
      doc.text(`Active Subscriber Base: ${s.totalSubscribers}`, 20, 95);

      let y = 120;
      doc.setFontSize(16);
      doc.text("Sector Breakdown", 20, y);
      doc.setFontSize(10);
      y += 15;
      areaBreakdown.forEach(([area, count]) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${area}: ${count} subscribers`, 25, y);
        y += 10;
      });

      const fileName = `Ops_Report_${now.toISOString().split("T")[0]}.pdf`;
      const blob = doc.output("blob");
      const saveAs = (await import("file-saver")).saveAs;
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {months[filterStartDate.getMonth()]} {filterStartDate.getFullYear()}
            {" → "}
            {months[filterEndDate.getMonth()]} {filterEndDate.getFullYear()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range selectors */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-1 py-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground px-1">From</span>
            <Select value={months[filterStartDate.getMonth()]} onValueChange={handleStartMonthChange}>
              <SelectTrigger className="h-7 w-[110px] border-none bg-transparent text-xs font-semibold shadow-none focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem 
                    key={m} 
                    value={m}
                    disabled={filterStartDate.getFullYear() === filterEndDate.getFullYear() && idx > filterEndDate.getMonth()}
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-border" />
            <Select value={filterStartDate.getFullYear().toString()} onValueChange={handleStartYearChange}>
              <SelectTrigger className="h-7 w-[70px] border-none bg-transparent text-xs font-semibold shadow-none focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem 
                    key={y} 
                    value={y.toString()}
                    disabled={y > filterEndDate.getFullYear()}
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-1 py-1">
            <span className="text-[9px] uppercase font-bold text-muted-foreground px-1">To</span>
            <Select value={months[filterEndDate.getMonth()]} onValueChange={handleEndMonthChange}>
              <SelectTrigger className="h-7 w-[110px] border-none bg-transparent text-xs font-semibold shadow-none focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem 
                    key={m} 
                    value={m}
                    disabled={filterEndDate.getFullYear() === filterStartDate.getFullYear() && idx < filterStartDate.getMonth()}
                  >
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-px bg-border" />
            <Select value={filterEndDate.getFullYear().toString()} onValueChange={handleEndYearChange}>
              <SelectTrigger className="h-7 w-[70px] border-none bg-transparent text-xs font-semibold shadow-none focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem 
                    key={y} 
                    value={y.toString()}
                    disabled={y < filterStartDate.getFullYear()}
                  >
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownloadReport}
            disabled={isGenerating}
            variant="outline"
            className="h-9 border-border text-muted-foreground hover:text-foreground"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="app-card p-5 space-y-4">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-0.5 w-full" />
            </div>
          ))
        ) : (
          [
            { label: "Today's Collection", value: formatCurrency(s.collectedToday), icon: TrendingUp, variant: "primary" as const, delta: "Today" },
            { label: "Monthly Revenue", value: formatCurrency(s.monthRevenue), icon: Wallet, variant: "success" as const, delta: "This period" },
            { label: "Pending Dues", value: formatCurrency(s.pendingDues), icon: AlertCircle, variant: "warning" as const, delta: "Action required" },
            { label: "Monthly Expenses", value: formatCurrency(s.monthExpenses), icon: FileText, variant: "destructive" as const, delta: "This period" },
          ].map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "New Payment", icon: Wallet, to: "/payments", color: "text-orange-600", bg: "bg-orange-50 border-orange-200 shadow-orange-100/50" },
          { label: "Subscribers", icon: Users, to: "/subscribers", color: "text-blue-600", bg: "bg-blue-50 border-blue-200 shadow-blue-100/50" },
          { label: "Billing", icon: FileText, to: "/invoices", color: "text-green-600", bg: "bg-green-50 border-green-200 shadow-green-100/50" },
          { label: "Reports", icon: BarChart3, to: "/reports", color: "text-purple-600", bg: "bg-purple-50 border-purple-200 shadow-purple-100/50" },
        ].map((action, i) => (
          <Link
            key={i}
            to={action.to}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 group shadow-sm",
              action.bg
            )}
          >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", action.bg.replace("bg-", "bg-white/60 "))}>
              <action.icon className={cn("h-5 w-5", action.color)} />
            </div>
            <span className={cn("text-xs font-bold uppercase tracking-wider", action.color)}>{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Collections */}
        <div className="lg:col-span-2">
          <div className="app-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Recent Collections</h2>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                  {recent.length}
                </span>
              </div>
              <Button variant="ghost" asChild className="text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-7 px-2">
                <Link to="/payments">View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold text-foreground">No recent transactions</p>
                <p className="text-xs text-muted-foreground">Payments will appear here</p>
              </div>
            ) : (
              <div>
                {recent.map((p) => {
                  const sub = subscribers.find((s) => s.id === p.subscriberId);
                  return (
                    <div key={p.id} className="flex items-center gap-3 py-3 px-5 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {(sub?.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{sub?.name || "Unknown Subscriber"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                            p.method === "Cash"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-blue-100 text-blue-600 border-blue-200"
                          )}>
                            {p.method}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-bold font-mono-num text-green-600">+{formatCurrency(p.amount)}</p>
                        {(p.discount > 0) && (
                          <p className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1 rounded">-{formatCurrency(p.discount)} DISC</p>
                        )}
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
          {/* Area Breakdown */}
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" /> Area Breakdown
            </h3>
            <div className="space-y-3">
              {areaBreakdown.slice(0, 5).map(([area, count]) => (
                <div key={area} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-foreground">{area}</span>
                    <span className="text-xs text-muted-foreground">{count} subs</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400 transition-all duration-500"
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {areaBreakdown.length === 0 && (
                <p className="text-xs text-muted-foreground">No area data yet</p>
              )}
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="app-card p-5 border-red-200 bg-red-50/50">
            <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Expiring Soon
            </h3>
            <div>
              {expiring.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming expirations</p>
              ) : (
                expiring.map((sub) => {
                  const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                  return (
                    <div key={sub.id} className="flex items-center justify-between py-2 border-b border-red-100/60 last:border-0">
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-medium text-foreground truncate">{sub.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sub.area}</p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0",
                        days <= 3 ? "bg-red-500 text-white" : "bg-amber-100 text-amber-700"
                      )}>
                        {days}d
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <Button variant="ghost" asChild className="w-full mt-3 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-7">
              <Link to="/subscribers">View All <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
