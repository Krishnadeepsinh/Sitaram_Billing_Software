import { StatCard } from "@/components/StatCard";
import { Wallet, Users, AlertCircle, Activity, ArrowUpRight, FileText, Download, MapPin, Loader2, Calendar } from "lucide-react";
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
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-1">
            {companySettings?.name || 'SITARAM CABLE & BROADBAND'} · Control Center
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tighter uppercase">
            Operations <span className="text-primary italic">Intelligence</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">
              Viewing Data for <span className="text-foreground">{months[dashboardDate.getMonth()]} {dashboardDate.getFullYear()}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-xl border border-border/40 backdrop-blur-sm">
            <Select value={months[dashboardDate.getMonth()]} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[120px] h-8 border-none bg-transparent focus:ring-0 text-xs font-bold uppercase">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="w-px h-3 bg-border/60" />
            <Select value={dashboardDate.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[80px] h-8 border-none bg-transparent focus:ring-0 text-xs font-bold uppercase">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y.toString()} className="text-xs">{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" asChild className="bg-gradient-primary text-primary-foreground hover:opacity-90 glow-primary rounded-xl px-4 h-10">
            <Link to="/invoices">
              <Wallet className="mr-2 h-4 w-4" /> Collect Payment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Collection" value={formatCurrency(s.collectedToday)} delta="+12.5% vs yesterday" icon={Activity} variant="primary" />
        <StatCard label="Month Revenue" value={formatCurrency(s.monthRevenue)} delta={`${payments.length} transactions`} icon={Activity} variant="accent" />
        <StatCard label="Pending Dues" value={formatCurrency(s.pendingDues)} delta={`${s.expired} total expired`} icon={AlertCircle} variant="warning" />
        <StatCard label="Expenses" value={formatCurrency(s.monthExpenses)} delta={`${expenses.length} records`} icon={FileText} variant="destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-lg font-bold">Recent Collections</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Latest 5 Transactions</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-lg hover:bg-primary/10 hover:text-primary"><Link to="/payments">View All <ArrowUpRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          <div className="space-y-1">
            {recent.map((p) => {
              const sub = subscribers.find(s => s.id === p.subscriberId);
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Wallet className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{sub?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{p.method} · {formatDate(p.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num font-bold text-success">+{formatCurrency(p.amount)}</p>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <Activity className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground italic">No collections recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-border/40 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4">Address Breakdown</h2>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {areaBreakdown.map(([area, count]) => (
                <div key={area} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {area}</span>
                    <span className="text-muted-foreground font-medium">{count} subs</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${(count / Math.max(1, subscribers.length)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border-border/40 shadow-sm bg-destructive/5">
            <h2 className="font-display text-lg font-bold text-destructive flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" /> Expiring
            </h2>
            <div className="space-y-3">
              {expiring.map((sub) => {
                const days = Math.ceil((+new Date(sub.expiryDate) - Date.now()) / 86400000);
                return (
                  <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{sub.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{sub.area}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${days <= 3 ? 'bg-destructive text-white' : 'bg-warning/20 text-warning'}`}>
                      {days}d left
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


