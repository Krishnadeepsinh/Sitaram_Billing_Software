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
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Receipt className="h-10 w-10 text-destructive" />
            Expenditures
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Monitor operational costs and maintenance logistics.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-bold"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl shadow-lg shadow-rose-500/20 px-6 font-bold">
                <Plus className="mr-2 h-4 w-4" /> Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Log New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Description</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="E.g., Office Rent, Fuel, Fiber broadband" 
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Amount (Rs.)</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00" 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Category</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryIcon) as Expense['category'][]).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          formData.category === cat 
                            ? 'border-primary bg-primary/5 text-primary scale-95' 
                            : 'border-transparent bg-secondary/50 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {(() => {
                          const Icon = categoryIcon[cat];
                          return <Icon className="h-4 w-4 mb-1" />;
                        })()}
                        <span className="text-[9px] font-black uppercase tracking-tighter">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-6 border-border/40 border-l-rose-500/50 border-l-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">Monthly Burn Rate</p>
          <p className="font-mono-num font-black text-3xl mt-2 tracking-tighter text-rose-500">{formatCurrency(s.monthExpenses)}</p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-rose-500 bg-rose-500/10 w-fit px-2 py-0.5 rounded-full uppercase tracking-wider">
            Critical Overhead
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 border-border/40">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">Total Transactions</p>
          <p className="font-display font-black text-xl mt-2 tracking-tight uppercase">{expenses.length}</p>
          <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Across {new Set(expenses.map(e => e.category)).size} Categories</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border-border/40">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">Operating Efficiency</p>
          <p className="font-mono-num font-black text-xl mt-2 tracking-tighter text-emerald-500">
            {s.monthRevenue > 0 ? ((1 - (s.monthExpenses / s.monthRevenue)) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Net Operating Margin</p>
        </div>
      </div>

      <div className="glass-card rounded-[1.5rem] overflow-hidden border-border/40 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black border-b border-border/60">
                <th className="px-6 py-5 font-black">Source / Description</th>
                <th className="px-6 py-5 font-black">Category</th>
                <th className="px-6 py-5 font-black">Timestamp</th>
                <th className="px-6 py-5 text-right font-black">Debit Amount</th>
                <th className="px-6 py-5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sortedExpenses.map((expense) => {
                const Icon = categoryIcon[expense.category];
                return (
                  <tr key={expense.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Receipt className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-foreground truncate">{expense.description}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">ID: {expense.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-secondary flex items-center justify-center">
                          <Icon className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black text-muted-foreground font-mono-num uppercase tracking-wider">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-mono-num font-black text-sm text-destructive">-{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic">No expenses logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



