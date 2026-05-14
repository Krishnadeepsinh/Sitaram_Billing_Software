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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <Receipt className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase leading-none">CAPITAL_FLOW_REGISTRY</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">Expense Matrix & Performance Index</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="h-8 px-3 rounded-md border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-400 font-black uppercase text-[8px] tracking-widest transition-all">
            <Download className="h-3 w-3 mr-1.5" />
            EXPORT
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[8px] shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                LOG_ENTRY
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-0 overflow-hidden">
              <div className="p-5 bg-blue-600 text-white">
                <DialogHeader>
                  <DialogTitle className="text-sm font-black uppercase tracking-[0.1em] flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    DEBIT_TRANSACTION_PROTOCOL
                  </DialogTitle>
                </DialogHeader>
                <p className="text-[7px] uppercase tracking-widest font-black opacity-70 mt-1">Initialize capital outflow sequence</p>
              </div>
              <form onSubmit={handleAddExpense} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">OBJECT_DESCRIPTION</Label>
                  <Input 
                    id="description" 
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="MAINTENANCE, RENT, ETC." 
                    className="h-9 rounded-lg bg-slate-900 border-slate-800 text-white focus:ring-blue-500/20 font-black text-[10px] transition-all uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">AMOUNT_VAL</Label>
                    <Input 
                      id="amount" 
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00" 
                      className="h-9 rounded-lg bg-slate-900 border-slate-800 text-white focus:ring-blue-500/20 font-mono font-black text-[10px] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">TIMESTAMP</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-9 rounded-lg bg-slate-900 border-slate-800 text-white focus:ring-blue-500/20 font-black text-[10px] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[8px] uppercase font-black tracking-[0.2em] text-slate-500 ml-1">CLASSIFICATION_TAG</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryIcon) as Expense['category'][]).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                          formData.category === cat 
                            ? 'border-blue-600 bg-blue-600/10 text-blue-500' 
                            : 'border-slate-800 bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {(() => {
                          const Icon = categoryIcon[cat];
                          return <Icon className="h-3 w-3 mb-1" />;
                        })()}
                        <span className="text-[6px] font-black uppercase tracking-widest">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-9 rounded-lg font-black text-[8px] uppercase tracking-widest text-slate-500 hover:text-white hover:bg-slate-800">ABORT</Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 h-9 bg-blue-600 text-white hover:bg-blue-500 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-lg shadow-blue-600/20">
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "COMMIT_LOG"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-xl border border-slate-800/50 border-l-blue-600/50 border-l-2 hover:bg-slate-900/60 transition-all shadow-xl">
          <p className="text-[7px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1 flex items-center gap-1.5">
            <Receipt className="h-2.5 w-2.5 text-blue-500" /> MONTHLY_BURN_RATE
          </p>
          <p className="text-xl font-black tracking-tighter text-white tabular-nums">{formatCurrency(s.monthExpenses)}</p>
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">AGGREGATE DEBIT</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-xl border border-slate-800/50 hover:bg-slate-900/60 transition-all shadow-xl">
          <p className="text-[7px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1 flex items-center gap-1.5">
            <Users className="h-2.5 w-2.5 text-slate-400" /> TRANS_COUNT
          </p>
          <p className="text-xl font-black tracking-tighter text-white tabular-nums">{expenses.length}</p>
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">ACTIVE ENTRIES</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-xl border border-slate-800/50 hover:bg-slate-900/60 transition-all shadow-xl">
          <p className="text-[7px] uppercase tracking-[0.3em] text-slate-500 font-black mb-1 flex items-center gap-1.5">
            <Globe className="h-2.5 w-2.5 text-blue-500" /> MARGIN_EFFICIENCY
          </p>
          <p className="text-xl font-black tracking-tighter text-blue-500 tabular-nums">
            {s.monthRevenue > 0 ? ((1 - (s.monthExpenses / s.monthRevenue)) * 100).toFixed(1) : '0'}%
          </p>
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">NET_PROFIT_INDEX</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-800/50 shadow-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/30">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-blue-500" />
            FINANCIAL_TRANSACTION_LEDGER
          </h3>
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{sortedExpenses.length} UNITS</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[7px] uppercase tracking-[0.3em] text-slate-600 font-black border-b border-slate-800 bg-slate-950/50">
                <th className="px-5 py-2.5">DESCRIPTION</th>
                <th className="px-5 py-2.5">CATEGORY</th>
                <th className="px-5 py-2.5">TIMESTAMP</th>
                <th className="px-5 py-2.5 text-right">DEBIT_VAL</th>
                <th className="px-5 py-2.5 w-12 text-right">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {sortedExpenses.map((expense) => {
                const Icon = categoryIcon[expense.category];
                return (
                  <tr key={expense.id} className="hover:bg-blue-600/[0.02] transition-colors group">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-blue-600/30 transition-all text-slate-500 group-hover:text-blue-500">
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[11px] text-white truncate uppercase tracking-tight leading-none">{expense.description}</p>
                          <p className="text-[7px] text-slate-600 uppercase font-black tracking-[0.1em] mt-1">REF: {expense.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-[9px] font-black text-slate-500 tabular-nums uppercase tracking-wider">{formatDate(expense.date)}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <p className="font-black text-xs text-rose-500 tabular-nums">-{formatCurrency(expense.amount)}</p>
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
                      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[8px] italic">No transaction data</p>
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



