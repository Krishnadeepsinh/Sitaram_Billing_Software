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
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-rose-500/30 selection:text-white pb-20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-rose-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
                <Receipt className="h-6 w-6 text-rose-500" />
              </div>
              <div className="h-1 w-12 bg-slate-800 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Operational Overhead</span>
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
              Business <span className="text-rose-500 italic">Expenses</span>
            </h1>
            <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
              Monitor operational costs and maintenance logistics. Keep your business burn rate under control.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleExportCSV} className="h-14 px-6 rounded-2xl border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-300 transition-all duration-300">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-5 w-5 mr-2" />
                  Log Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl p-0 overflow-hidden">
                <div className="p-8 bg-rose-500 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                      <Plus className="h-6 w-6" />
                      New Entry
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mt-2">Log operational overhead object</p>
                </div>
                <form onSubmit={handleAddExpense} className="p-8 space-y-6 bg-slate-900">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">Object Description</Label>
                    <Input 
                      id="description" 
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="E.g., Office Rent, Fuel, Fiber Line..." 
                      className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white focus:ring-rose-500/20 font-bold transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">Amount (INR)</Label>
                      <Input 
                        id="amount" 
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00" 
                        className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white focus:ring-rose-500/20 font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">Timestamp</Label>
                      <Input 
                        id="date" 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="h-12 rounded-xl bg-slate-950 border-slate-800 text-white focus:ring-rose-500/20 font-bold transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">Classification Category</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(categoryIcon) as Expense['category'][]).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                            formData.category === cat 
                              ? 'border-rose-500 bg-rose-500/10 text-rose-500 scale-[0.98]' 
                              : 'border-slate-800 bg-slate-950 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                          }`}
                        >
                          {(() => {
                            const Icon = categoryIcon[cat];
                            return <Icon className="h-5 w-5 mb-2" />;
                          })()}
                          <span className="text-[8px] font-black uppercase tracking-widest">{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Entry"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-800 border-l-rose-500 border-l-8 hover:border-rose-500/30 transition-all duration-500 group shadow-2xl shadow-black/20">
            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2 group-hover:text-rose-500 transition-colors">Monthly Burn Rate</p>
            <p className="text-5xl font-black tracking-tighter text-white tabular-nums">{formatCurrency(s.monthExpenses)}</p>
            <div className="flex items-center gap-1.5 mt-6 text-[9px] font-black text-rose-500 bg-rose-500/10 w-fit px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-rose-500/20">
              Critical Overhead
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-800 hover:border-primary/30 transition-all duration-500 group shadow-2xl shadow-black/20">
            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2 group-hover:text-primary transition-colors">Total Transactions</p>
            <p className="text-5xl font-black tracking-tighter text-white tabular-nums">{expenses.length}</p>
            <p className="text-[9px] text-slate-500 mt-6 font-black uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800 w-fit">Indexed Groups: {new Set(expenses.map(e => e.category)).size}</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-800 hover:border-emerald-500/30 transition-all duration-500 group shadow-2xl shadow-black/20">
            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-black mb-2 group-hover:text-emerald-500 transition-colors">Operating Efficiency</p>
            <p className="text-5xl font-black tracking-tighter text-emerald-500 tabular-nums">
              {s.monthRevenue > 0 ? ((1 - (s.monthExpenses / s.monthRevenue)) * 100).toFixed(1) : '0'}%
            </p>
            <p className="text-[9px] text-slate-500 mt-6 font-black uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800 w-fit">Net Profit Margin</p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] border border-slate-800 shadow-2xl shadow-black/40 overflow-hidden mb-20">
          <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white flex items-center gap-4">
              <Receipt className="h-6 w-6 text-rose-500" />
              Expense Ledger
            </h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-4 py-2 rounded-full border border-slate-800">{sortedExpenses.length} Entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-black border-b border-slate-800 bg-slate-950/50">
                  <th className="px-10 py-6">Description</th>
                  <th className="px-10 py-6">Category</th>
                  <th className="px-10 py-6">Timestamp</th>
                  <th className="px-10 py-6 text-right">Debit Amount</th>
                  <th className="px-10 py-6 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedExpenses.map((expense) => {
                  const Icon = categoryIcon[expense.category];
                  return (
                    <tr key={expense.id} className="hover:bg-slate-800/50 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/5">
                            <Receipt className="h-5 w-5 text-rose-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-base text-white truncate uppercase tracking-tight group-hover:text-rose-500 transition-colors">{expense.description}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-1">REF_{expense.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center text-slate-400 border border-slate-800 group-hover:border-slate-700 group-hover:text-slate-300 transition-all">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">{expense.category}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-bold text-slate-400 tabular-nums uppercase tracking-wider group-hover:text-slate-300 transition-colors">{formatDate(expense.date)}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <p className="font-black text-lg text-rose-500 tabular-nums">-{formatCurrency(expense.amount)}</p>
                      </td>
                      <td className="px-10 py-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-10 w-10 rounded-xl text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-6 opacity-20">
                        <Receipt className="h-16 w-16 text-slate-400" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm italic">Financial ledger currently empty</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



