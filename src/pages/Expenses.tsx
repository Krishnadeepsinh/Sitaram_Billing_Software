import { useState } from "react";
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
  const { expenses, stats: s, addExpense, deleteExpense } = useBilling();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Other' as Expense['category'],
    date: new Date().toISOString().split('T')[0]
  });

  const sortedExpenses = [...expenses].sort((a, b) => +new Date(b.date) - +new Date(a.date));

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
    const rows = sortedExpenses.map(e => [
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 shadow-sm">
            <Receipt className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-white">Expenses</h1>
            <p className="text-sm text-slate-500">Operating costs and monthly burn</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="h-9 rounded-lg border-slate-700 bg-slate-900/60 px-3 text-xs font-medium text-slate-300 hover:bg-slate-800">
            <Download className="mr-2 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add expense
              </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-0 shadow-2xl sm:max-w-[400px]">
              <div className="bg-indigo-600 p-5 text-white">
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
                    className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm text-white focus-visible:ring-indigo-500/25"
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
                      className="h-10 rounded-lg border-slate-800 bg-slate-900 font-mono text-sm text-white focus-visible:ring-indigo-500/25"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs font-medium text-slate-400">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-10 rounded-lg border-slate-800 bg-slate-900 text-sm text-white focus-visible:ring-indigo-500/25"
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
                            ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' 
                            : 'border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
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
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-10 flex-1 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="h-10 flex-1 rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-slate-900 rounded-xl border border-white/10 border-l-4 border-l-indigo-500 p-5 transition-colors hover:border-white/20">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Receipt className="h-3.5 w-3.5 text-indigo-400" /> This month
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-white">{formatCurrency(s.monthExpenses)}</p>
          <p className="mt-1 text-xs text-slate-500">Total spend</p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-white/10 p-5 transition-colors hover:border-white/20">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Users className="h-3.5 w-3.5 text-slate-400" /> Entries
          </p>
          <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-white">{expenses.length}</p>
          <p className="mt-1 text-xs text-slate-500">Logged expenses</p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-white/10 p-5 transition-colors hover:border-white/20">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Globe className="h-3.5 w-3.5 text-indigo-400" /> Margin
            </p>
            <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-indigo-400">
            {s.monthRevenue > 0 ? ((1 - (s.monthExpenses / s.monthRevenue)) * 100).toFixed(1) : '0'}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Approx. net of expenses</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/50 px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Receipt className="h-4 w-4 text-indigo-400" />
              Expense ledger
            </h3>
          <span className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-xs font-medium text-slate-500">{sortedExpenses.length} rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50">
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Description</th>
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Category</th>
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 uppercase tracking-wider">Date</th>
                <th className="text-xs font-medium text-slate-400 px-5 py-2.5 text-right uppercase tracking-wider">Amount</th>
                <th className="text-xs font-medium text-slate-400 w-12 px-5 py-2.5 text-right uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedExpenses.map((expense) => {
                const Icon = categoryIcon[expense.category];
                return (
                    <tr key={expense.id} className="hover:bg-indigo-600/[0.02] transition-colors group">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-indigo-600/30 transition-all text-slate-500 group-hover:text-indigo-500">
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-none text-white">{expense.description}</p>
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
                      <p className="text-sm font-semibold tabular-nums text-rose-400">-{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-6 w-6 rounded-md text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
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



