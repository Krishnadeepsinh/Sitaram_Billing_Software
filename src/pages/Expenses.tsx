import { useState, useMemo } from "react";
import { formatCurrency, formatDate, Expense } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, Fuel, Users, Wrench, Home, Globe, HelpCircle, Download, Trash2, X, Loader2 } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const categoryIcon = {
  Fuel: Fuel,
  Salary: Users,
  Maintenance: Wrench,
  Office: Home,
  Internet: Globe,
  Other: HelpCircle,
} as const;

export default function Expenses() {
  const { 
    expenses, 
    stats: s, 
    addExpense, 
    deleteExpense,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate
  } = useBilling();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Other' as Expense['category'],
    date: new Date().toISOString().split('T')[0]
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2024, 2025, 2026];

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e || !e.date) return false;
      const d = new Date(e.date);
      return d >= filterStartDate && d <= filterEndDate;
    }).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [expenses, filterStartDate, filterEndDate]);

  const rangeTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString()
      });
      toast.success("Expense logged successfully");
      setIsModalOpen(false);
      setFormData({
        description: '',
        amount: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      toast.error("Failed to log expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch (err) {
      toast.error("Failed to delete expense");
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Description", "Category", "Amount", "Date"];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.description,
      e.category,
      e.amount,
      formatDate(e.date)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Expenses_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Expenses exported to CSV");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 space-y-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
            <Receipt className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-slate-800">Expenses</h1>
            <p className="text-sm text-slate-500">Operating costs and monthly burn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="h-9 rounded-lg border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100">
            <Download className="mr-2 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-lg bg-orange-500 px-4 text-xs font-medium text-slate-800 shadow-md shadow-indigo-600/25 hover:bg-indigo-500">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add expense
              </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-0 shadow-xl sm:max-w-[400px]">
              <div className="bg-orange-500 p-5 text-slate-800">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                    <Receipt className="h-4 w-4" />
                    New expense
                  </DialogTitle>
                </DialogHeader>
                <p className="mt-1 text-sm text-indigo-100/90">Record a one-off or recurring cost.</p>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium text-slate-400">Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Rent, fuel, maintenance" 
                    className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus-visible:ring-orange-400/25"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs font-medium text-slate-400">Amount</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00" 
                      className="h-10 rounded-lg border-slate-200 bg-white font-mono text-sm text-slate-800 focus-visible:ring-orange-400/25"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs font-medium text-slate-400">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-10 rounded-lg border-slate-200 bg-white text-sm text-slate-800 focus-visible:ring-orange-400/25"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryIcon) as Expense['category'][]).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`flex flex-col items-center justify-center rounded-lg border p-2 transition-colors ${
                          formData.category === cat 
                            ? 'border-indigo-600 bg-orange-50 text-orange-600' 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                      >
                        {(() => {
                          const Icon = categoryIcon[cat];
                          return <Icon className="mb-1 h-3.5 w-3.5" />;
                        })()}
                        <span className="text-[10px] font-medium">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-10 flex-1 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-800">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="h-10 flex-1 rounded-lg bg-orange-500 text-sm font-medium text-slate-800 shadow-md shadow-indigo-600/25 hover:bg-indigo-500">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Range Filter */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="flex flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2">From</span>
              <select value={months[filterStartDate.getMonth()]} onChange={(e) => {
                const monthIndex = months.indexOf(e.target.value);
                const d = new Date(filterStartDate);
                d.setMonth(monthIndex);
                setFilterStartDate(d);
              }} className="bg-transparent text-xs text-slate-600 outline-none appearance-none cursor-pointer flex-1">
                {months.map(m => <option key={m} value={m} className="bg-white">{m}</option>)}
              </select>
              <select value={filterStartDate.getFullYear()} onChange={(e) => {
                const d = new Date(filterStartDate);
                d.setFullYear(Number(e.target.value));
                setFilterStartDate(d);
              }} className="bg-transparent text-xs text-slate-600 outline-none appearance-none cursor-pointer w-14">
                {years.map(y => <option key={y} value={y} className="bg-white">{y}</option>)}
              </select>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 px-2">To</span>
              <select value={months[filterEndDate.getMonth()]} onChange={(e) => {
                const monthIndex = months.indexOf(e.target.value);
                const d = new Date(filterEndDate);
                d.setMonth(monthIndex + 1);
                d.setDate(0);
                d.setHours(23, 59, 59, 999);
                setFilterEndDate(d);
              }} className="bg-transparent text-xs text-slate-600 outline-none appearance-none cursor-pointer flex-1">
                {months.map(m => <option key={m} value={m} className="bg-white">{m}</option>)}
              </select>
              <select value={filterEndDate.getFullYear()} onChange={(e) => {
                const d = new Date(filterEndDate);
                d.setFullYear(Number(e.target.value));
                setFilterEndDate(d);
              }} className="bg-transparent text-xs text-slate-600 outline-none appearance-none cursor-pointer w-14">
                {years.map(y => <option key={y} value={y} className="bg-white">{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-500">Range Total</span>
            <span className="text-lg font-black text-red-500 tabular-nums">-{formatCurrency(rangeTotal)}</span>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500">Records</span>
            <span className="text-lg font-black text-slate-800">{filteredExpenses.length}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-500 p-5 transition-colors hover:border-slate-300">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Receipt className="h-3.5 w-3.5 text-orange-600" /> Current Selection
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-slate-800">{formatCurrency(rangeTotal)}</p>
          <p className="mt-1 text-xs text-slate-500">Total range spend</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 transition-colors hover:border-slate-300">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Users className="h-3.5 w-3.5 text-slate-400" /> Count
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-slate-800">{filteredExpenses.length}</p>
          <p className="mt-1 text-xs text-slate-500">Filtered entries</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 transition-colors hover:border-slate-300">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Globe className="h-3.5 w-3.5 text-orange-600" /> Margin
            </p>
            <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-orange-600">
            {s.monthRevenue > 0 ? ((1 - (rangeTotal / s.monthRevenue)) * 100).toFixed(1) : '0'}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Approx. net in range</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Receipt className="h-4 w-4 text-orange-600" />
              Expense ledger
            </h3>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{filteredExpenses.length} rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Description</th>
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Category</th>
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Date</th>
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 text-right uppercase tracking-wider">Amount</th>
                <th className="text-xs font-medium text-slate-400 w-12 px-5 py-2.5 text-right uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => {
                const Icon = categoryIcon[expense.category];
                return (
                    <tr key={expense.id} className="hover:bg-orange-500/[0.02] transition-colors group">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-indigo-600/30 transition-all text-slate-500 group-hover:text-orange-500">
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-none text-slate-800">{expense.description}</p>
                          <p className="mt-1 font-mono text-[11px] text-slate-500">Ref {expense.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-400">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-xs font-medium tabular-nums text-slate-500">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <p className="text-sm font-semibold tabular-nums text-red-500">-{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-6 w-6 rounded-md text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-10">
                      <Receipt className="h-10 w-10 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500">No expenses recorded yet</p>
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



