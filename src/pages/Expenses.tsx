import { useState, useMemo } from "react";
import { formatCurrency, formatDate, Expense } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Fuel, Users, Wrench, Home, Globe, HelpCircle, Download, Trash2, X, Loader2 } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categoryIcon = {
  Fuel: Fuel, Salary: Users, Maintenance: Wrench, Office: Home, Internet: Globe, Other: HelpCircle,
} as const;

const categoryColor: Record<string, string> = {
  Fuel: "bg-orange-100 text-orange-600", Salary: "bg-blue-100 text-blue-600",
  Maintenance: "bg-amber-100 text-amber-600", Office: "bg-purple-100 text-purple-600",
  Internet: "bg-green-100 text-green-600", Other: "bg-slate-100 text-slate-600",
};

export default function Expenses() {
  const { expenses, stats: s, addExpense, deleteExpense, filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate } = useBilling();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '', amount: '', category: 'Other' as Expense['category'],
    date: new Date().toISOString().split('T')[0]
  });

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const years = [2024, 2025, 2026];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e || !e.date) return false;
      const d = new Date(e.date);
      return d >= filterStartDate && d <= filterEndDate;
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [expenses, filterStartDate, filterEndDate]);

  const rangeTotal = useMemo(() => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [filteredExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) { toast.error("Please fill in all required fields"); return; }
    setIsSubmitting(true);
    try {
      await addExpense({ description: formData.description, amount: Number(formData.amount), category: formData.category, date: new Date(formData.date).toISOString() });
      toast.success("Expense logged successfully");
      setIsModalOpen(false);
      setFormData({ description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0] });
    } catch (err) { toast.error("Failed to log expense"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try { await deleteExpense(id); toast.success("Expense deleted"); }
    catch (err) { toast.error("Failed to delete expense"); }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) { toast.error("No data to export"); return; }
    const headers = ["ID","Description","Category","Amount","Date"];
    const rows = filteredExpenses.map(e => [e.id, e.description, e.category, e.amount, formatDate(e.date)]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Expenses_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Expenses exported to CSV");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Operating costs and monthly burn rate.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-red-100 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm font-semibold font-mono-num">
            -{formatCurrency(rangeTotal)}
          </span>
          <Button variant="outline" onClick={handleExportCSV} className="h-9 border-border text-muted-foreground hover:text-foreground">
            <Download className="mr-2 h-3.5 w-3.5" />Export CSV
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-0">
              <DialogHeader className="px-6 py-4 border-b border-border">
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-orange-500" />New Expense
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                  <Input value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                    placeholder="e.g. Rent, fuel, maintenance"
                    className="h-9 bg-input border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (Rs.)</Label>
                    <Input type="number" value={formData.amount} onChange={e => setFormData(p => ({...p, amount: e.target.value}))}
                      placeholder="0.00"
                      className="h-9 bg-input border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg font-mono-num" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData(p => ({...p, date: e.target.value}))}
                      className="h-9 bg-input border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryIcon) as Expense['category'][]).map(cat => (
                      <button key={cat} type="button" onClick={() => setFormData(p => ({...p, category: cat}))}
                        className={cn("flex flex-col items-center justify-center rounded-lg border p-2 transition-colors text-xs font-medium",
                          formData.category === cat ? "border-orange-400 bg-orange-50 text-orange-600" : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary")}>
                        {(() => { const Icon = categoryIcon[cat]; return <Icon className="mb-1 h-3.5 w-3.5" />; })()}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-2 bg-secondary/20">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} onClick={handleAddExpense} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter bar */}
      <div className="app-card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-1 py-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground px-1">From</span>
          <select value={months[filterStartDate.getMonth()]} onChange={e => {
            const idx = months.indexOf(e.target.value);
            const d = new Date(filterStartDate);
            d.setMonth(idx);
            if (d > filterEndDate) {
              setFilterStartDate(d);
              const end = new Date(d);
              end.setMonth(d.getMonth() + 1);
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              setFilterEndDate(end);
            } else {
              setFilterStartDate(d);
            }
          }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer px-1">
            {months.map((m, idx) => (
              <option 
                key={m} 
                value={m}
                disabled={filterStartDate.getFullYear() === filterEndDate.getFullYear() && idx > filterEndDate.getMonth()}
              >
                {m}
              </option>
            ))}
          </select>
          <select value={filterStartDate.getFullYear()} onChange={e => {
            const d = new Date(filterStartDate);
            d.setFullYear(Number(e.target.value));
            if (d > filterEndDate) {
              setFilterStartDate(d);
              const end = new Date(d);
              end.setMonth(d.getMonth() + 1);
              end.setDate(0);
              end.setHours(23, 59, 59, 999);
              setFilterEndDate(end);
            } else {
              setFilterStartDate(d);
            }
          }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer w-14">
            {years.map(y => (
              <option key={y} value={y} disabled={y > filterEndDate.getFullYear()}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border px-1 py-1">
          <span className="text-[9px] uppercase font-bold text-muted-foreground px-1">To</span>
          <select value={months[filterEndDate.getMonth()]} onChange={e => {
            const idx = months.indexOf(e.target.value);
            const d = new Date(filterEndDate);
            d.setMonth(idx + 1);
            d.setDate(0);
            d.setHours(23, 59, 59, 999);
            if (d < filterStartDate) {
              setFilterEndDate(d);
              const start = new Date(d);
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              setFilterStartDate(start);
            } else {
              setFilterEndDate(d);
            }
          }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer px-1">
            {months.map((m, idx) => (
              <option 
                key={m} 
                value={m}
                disabled={filterEndDate.getFullYear() === filterStartDate.getFullYear() && idx < filterStartDate.getMonth()}
              >
                {m}
              </option>
            ))}
          </select>
          <select value={filterEndDate.getFullYear()} onChange={e => {
            const d = new Date(filterEndDate);
            d.setFullYear(Number(e.target.value));
            if (d < filterStartDate) {
              setFilterEndDate(d);
              const start = new Date(d);
              start.setDate(1);
              start.setHours(0, 0, 0, 0);
              setFilterStartDate(start);
            } else {
              setFilterEndDate(d);
            }
          }} className="bg-transparent text-xs text-foreground outline-none appearance-none cursor-pointer w-14">
            {years.map(y => (
              <option key={y} value={y} disabled={y < filterStartDate.getFullYear()}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold font-mono-num text-red-600">-{formatCurrency(rangeTotal)}</p>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Records</p>
            <p className="text-sm font-bold font-mono-num text-foreground">{filteredExpenses.length}</p>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="data-table">
        <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-5 py-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-500" />Expense Ledger
          </h3>
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {filteredExpenses.length} rows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => {
                const Icon = categoryIcon[expense.category];
                return (
                  <tr key={expense.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors group last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", categoryColor[expense.category] ?? "bg-secondary text-muted-foreground")}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{expense.description}</p>
                          <p className="text-xs text-muted-foreground font-mono-num">#{expense.id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", categoryColor[expense.category] ?? "bg-secondary text-muted-foreground")}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold font-mono-num text-red-600">-{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-7 w-7 rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                        <Receipt className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No expenses recorded yet</p>
                      <p className="text-xs text-muted-foreground">Log your first expense to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
