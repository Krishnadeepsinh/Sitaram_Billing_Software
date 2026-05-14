import { useState } from "react";
import { useBilling } from "@/context/BillingContext";
import { Input } from "@/components/ui/input";
import { useBusinessMode } from "@/lib/turso";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Wifi, Edit2, Trash2, Loader2, Shield, Activity, 
  ChevronRight, X, Signal, Zap, DatabaseZap, Clock,
  ArrowUpRight, ShieldCheck, Network, Globe
} from "lucide-react";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function Plans() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const { subscribers, plans, addPlan, updatePlan, deletePlan } = useBilling();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, validityDays: 30, speedMbps: 100, priceWithoutGst: 0, providerPlanId: '', category: 'renewal' as 'welcome' | 'renewal' | 'iptv' });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{type: 'delete', id: string} | null>(null);

  const categoryLabel: Record<string, string> = {
    welcome: "Welcome",
    renewal: "Renewal",
    iptv: "IPTV Bundle",
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({ name: '', price: 0, validityDays: 30, speedMbps: 100, priceWithoutGst: 0, providerPlanId: '', category: 'renewal' });
    setShowModal(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      validityDays: plan.validityDays,
      speedMbps: plan.speedMbps,
      priceWithoutGst: plan.priceWithoutGst || plan.price || 0,
      providerPlanId: plan.providerPlanId || '',
      category: plan.category || 'renewal'
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        priceWithoutGst: formData.price,
      };
      if (editingPlan) {
        await updatePlan(editingPlan.id, payload);
      } else {
        await addPlan(payload);
      }
      setShowModal(false);
      toast.success(editingPlan ? "Plan updated" : "Plan added");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deletePlan(id);
      toast.success("Plan purged from registry");
    } catch (err) {
      toast.error("Operation Failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10 w-fit">
            <Zap className="h-3 w-3 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/80">Service Matrix Configuration</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">
            Asset <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Templates</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 tracking-wide uppercase">Infrastructure Product Catalog & Yield Settings</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleOpenAdd}
            className="h-12 rounded-xl bg-blue-600 px-8 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> Initialize Schema
          </Button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="app-panel overflow-hidden border border-white/5 bg-slate-900/30 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/50 px-6 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Active Service Schemas</p>
          <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-400 italic">
            Registry Count: {plans.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Plan ID / Metadata</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Yield Value (₹)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Cycle Scope</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{isCableMode ? "Units" : "Throughput"}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Node Penetration</th>
                <th className="px-6 py-4 w-40 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plans.map((p) => {
                const count = subscribers.filter((s) => s.planId === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-blue-600/[0.03] transition-all duration-300 group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all shadow-inner">
                          <Network className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white tracking-widest group-hover:text-blue-400 transition-colors uppercase italic">{p.name}</span>
                          <span className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-2">
                            <DatabaseZap className="h-3 w-3" /> REF: {p.providerPlanId || "SYSTEM_DEFAULT"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-blue-400 italic tabular-nums tracking-tighter">{formatCurrency(p.price)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-slate-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 tabular-nums">
                          {p.validityDays} DAYS
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Signal className="h-3 w-3 text-blue-500/50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 tabular-nums italic">
                          {isCableMode ? `${p.speedMbps} UNITS` : `${p.speedMbps} MBPS`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-1.5 w-1.5 rounded-full", count > 0 ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-800")} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{count} REGISTERED NODES</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 text-slate-500 hover:text-white shadow-inner" onClick={() => handleOpenEdit(p)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-600/10" onClick={() => setConfirmModal({ type: 'delete', id: p.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 border border-white/5 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Signal className="h-40 w-40 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                  <Wifi className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">{editingPlan ? "Modify" : "Initialize"} Schema</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-3 italic">System Product Definition</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="h-12 w-12 rounded-2xl text-slate-500 hover:bg-slate-800"><X className="h-6 w-6" /></Button>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">Schema Label</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="E.G. FIBER_ULTRA_GIGA" 
                  className="h-14 rounded-2xl border-white/5 bg-slate-950 px-6 text-[11px] font-black uppercase tracking-widest text-white focus-visible:border-blue-500/50 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">Asset Yield (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="h-14 rounded-2xl border-white/5 bg-slate-950 px-6 font-mono text-[13px] font-black text-blue-400 focus-visible:border-blue-500/50 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">Lifecycle (Days)</Label>
                  <Input 
                    type="number" 
                    value={formData.validityDays || ''} 
                    onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} 
                    className="h-14 rounded-2xl border-white/5 bg-slate-950 px-6 text-[13px] font-black text-white focus-visible:border-blue-500/50 shadow-inner tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">
                    {isCableMode ? "Allocated Units" : "Throughput (Mbps)"}
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.speedMbps || ''} 
                    onChange={e => setFormData({...formData, speedMbps: Number(e.target.value)})} 
                    className="h-14 rounded-2xl border-white/5 bg-slate-950 px-6 text-[13px] font-black text-white focus-visible:border-blue-500/50 shadow-inner tabular-nums"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">Registry Reference</Label>
                  <Input 
                    value={formData.providerPlanId} 
                    onChange={e => setFormData({...formData, providerPlanId: e.target.value})} 
                    className="h-14 rounded-2xl border-white/5 bg-slate-950 px-6 font-mono text-[11px] font-black text-slate-400 focus-visible:border-blue-500/50 shadow-inner uppercase tracking-widest"
                    placeholder="OPTIONAL_REF_ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] ml-2">Protocol Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as "welcome" | "renewal" | "iptv",
                    })
                  }
                  className="h-14 w-full rounded-2xl border border-white/5 bg-slate-950 px-6 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:ring-2 focus:ring-blue-500/25 appearance-none shadow-inner"
                >
                  {(Object.keys(categoryLabel) as (keyof typeof categoryLabel)[]).map((k) => (
                    <option key={k} value={k} className="bg-slate-900">
                      {categoryLabel[k].toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <Button variant="ghost" className="flex-1 h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all" onClick={() => setShowModal(false)}>Abort Change</Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 h-16 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-600/30 font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all"
                >
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShieldCheck className="mr-2 h-5 w-5" />}
                  Commit Schema
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Prompt */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[4rem] p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]" />
            <div className="h-20 w-20 mx-auto rounded-[2.5rem] bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-rose-600/10 animate-pulse">
              <Trash2 className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-4">Registry <span className="text-rose-500">Purge</span></h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black leading-loose px-4 mb-10 italic">
              SCHEMA REMOVAL DETECTED. EXISTING NODES MAY LOSE ALLOCATION CONTEXT. AUTHENTICATE COMMAND.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="destructive" 
                className="h-14 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] bg-rose-600 hover:bg-rose-500 shadow-2xl shadow-rose-600/30 transition-all active:scale-95" 
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Confirm Eradication
              </Button>
              <Button variant="ghost" className="h-14 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-600 hover:text-white transition-all" onClick={() => setConfirmModal(null)}>Abort Protocol</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
