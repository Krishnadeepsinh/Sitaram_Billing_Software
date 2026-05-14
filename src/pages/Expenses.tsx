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
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-rose-500 font-black mb-2 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Financial Audit · Operational Costs
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            Business <span className="text-rose-500 italic">Expenses</span>
          </h1>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            Monitor operational costs and maintenance logistics.
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="h-14 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest px-6 shadow-sm transition-all"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 bg-rose-500 text-white hover:bg-rose-600 rounded-2xl shadow-lg shadow-rose-500/20 px-8 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4" /> Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
              <div className="p-8 bg-rose-500 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <Receipt className="h-6 w-6" />
                    New Expense
                  </DialogTitle>
                </DialogHeader>
                <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mt-2">Log operational overhead object</p>
              </div>
              <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Object Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="E.g., Office Rent, Fuel, Fiber Line..." 
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-rose-500/10 font-bold transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Amount (INR)</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00" 
                      className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-rose-500/10 font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Timestamp</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-rose-500/10 font-bold transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Classification Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryIcon) as Expense['category'][]).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                          formData.category === cat 
                            ? 'border-rose-500 bg-rose-50 text-rose-600 scale-[0.98]' 
                            : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
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
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Entry"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm border-l-rose-500 border-l-8 hover:border-rose-100 transition-all">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black mb-1">Monthly Burn Rate</p>
          <p className="font-black text-4xl tracking-tighter text-slate-900 tabular-nums">{formatCurrency(s.monthExpenses)}</p>
          <div className="flex items-center gap-1.5 mt-4 text-[9px] font-black text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-full uppercase tracking-widest border border-rose-100">
            Critical Overhead
          </div>
        </div>
        <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm hover:border-primary/10 transition-all">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black mb-1">Total Transactions</p>
          <p className="font-black text-4xl tracking-tighter text-slate-900 uppercase tabular-nums">{expenses.length}</p>
          <p className="text-[9px] text-slate-400 mt-4 font-black uppercase tracking-widest">Indexed across {new Set(expenses.map(e => e.category)).size} Groups</p>
        </div>
        <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm hover:border-emerald-100 transition-all">
          <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black mb-1">Operating Efficiency</p>
          <p className="font-black text-4xl tracking-tighter text-emerald-500 tabular-nums">
            {s.monthRevenue > 0 ? ((1 - (s.monthExpenses / s.monthRevenue)) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-[9px] text-slate-400 mt-4 font-black uppercase tracking-widest">Net Profit Margin Index</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black tracking-tight text-slate-900">Expense Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-slate-100">
                <th className="px-8 py-6">Source / Description</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6 text-right">Debit Amount</th>
                <th className="px-8 py-6 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedExpenses.map((expense) => {
                const Icon = categoryIcon[expense.category];
                return (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Receipt className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 truncate uppercase tracking-tight">{expense.description}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">OBJECT_ID: {expense.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-slate-500 tabular-nums uppercase tracking-wider">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className="font-black text-sm text-rose-600 tabular-nums">-{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                      <Receipt className="h-12 w-12 text-slate-400" />
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No entries indexed in ledger</p>
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



