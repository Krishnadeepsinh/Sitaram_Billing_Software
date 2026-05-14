import { useState } from "react";
import { useBilling } from "@/context/BillingContext";
import { Input } from "@/components/ui/input";
import { useBusinessMode } from "@/lib/turso";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Wifi, Edit2, Trash2, Loader2, Shield, Activity, ChevronRight, X } from "lucide-react";
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
      toast.success(editingPlan ? "Protocol Updated" : "Node Initialized");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deletePlan(id);
      toast.success("Protocol Purged");
    } catch (err) {
      toast.error("Operation Failed");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* INDUSTRIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black mb-1 flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-500" />
            INFRASTRUCTURE · SERVICE TIERS
          </p>
          <h1 className="font-display text-2xl font-black tracking-tighter text-white uppercase leading-none">
            Network <span className="text-blue-600 italic">Topology</span>
          </h1>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="h-8 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> Initialize Tier
        </Button>
      </div>

      {/* HIGH-DENSITY PROTOCOL TABLE */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-800/50 shadow-2xl overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Active Service Protocols</p>
          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest bg-blue-600/10 px-2 py-0.5 rounded border border-blue-600/20">{plans.length} Nodes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[7px] font-black uppercase tracking-[0.3em] text-slate-600">
                <th className="px-4 py-2.5">Protocol Identity</th>
                <th className="px-4 py-2.5">Tariff</th>
                <th className="px-4 py-2.5">Cycle</th>
                <th className="px-4 py-2.5">{isCableMode ? "Units" : "Bandwidth"}</th>
                <th className="px-4 py-2.5">Connectivity</th>
                <th className="px-4 py-2.5 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {plans.map((p) => {
                const count = subscribers.filter((s) => s.planId === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-blue-500 group-hover:border-blue-600/30 transition-all">
                          <Wifi className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs tracking-tight text-white uppercase leading-none">{p.name}</span>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Ref: {p.providerPlanId || "GLOBAL"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-black text-xs text-blue-500">{formatCurrency(p.price)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {p.validityDays} Days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white tabular-nums">
                        {isCableMode ? `${p.speedMbps} Unit` : `${p.speedMbps} Mbps`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1 w-1 rounded-full", count > 0 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-800")} />
                        <span className="font-black text-[9px] text-slate-500 uppercase tracking-tighter">{count} Nodes</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-600 hover:text-white hover:bg-slate-800 transition-all" onClick={() => handleOpenEdit(p)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all" onClick={() => setConfirmModal({ type: 'delete', id: p.id })}>
                          <Trash2 className="h-3 w-3" />
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

      {/* MODAL SECTION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg p-10 rounded-[3.5rem] shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-5 mb-10">
              <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner">
                <Wifi className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{editingPlan ? 'Modify Protocol' : 'New Tier Entry'}</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Core Bandwidth Specification</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Protocol Descriptor</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. ULTIMATE_FIBER_200" 
                  className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Tariff Value (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-mono font-black text-xs text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Cycle Length (Days)</Label>
                  <Input 
                    type="number" 
                    value={formData.validityDays || ''} 
                    onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">
                    {isCableMode ? "Unit Payload" : "Throughput (Mbps)"}
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.speedMbps || ''} 
                    onChange={e => setFormData({...formData, speedMbps: Number(e.target.value)})} 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-black text-xs text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600 ml-1">Logic Ref ID</Label>
                  <Input 
                    value={formData.providerPlanId} 
                    onChange={e => setFormData({...formData, providerPlanId: e.target.value})} 
                    className="h-11 rounded-xl bg-slate-950 border-slate-800 focus:border-blue-600/50 font-mono font-black text-[10px] text-slate-400"
                    placeholder="PLAN_HASH_00"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-white" onClick={() => setShowModal(false)}>Discard</Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 h-12 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 font-black text-[10px] uppercase tracking-widest"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                Commit Tier
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white w-full max-w-sm p-10 rounded-[3rem] shadow-2xl border border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 mx-auto mb-6">
              <Trash2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black mb-3 uppercase tracking-tighter">Purge Protocol?</h2>
            <p className="text-slate-500 mb-8 font-black text-[9px] uppercase tracking-widest leading-relaxed">
              This will permanently delete the service tier. Nodes currently utilizing this protocol will require immediate reconfiguration.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="destructive" 
                className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-rose-600 shadow-xl shadow-rose-600/20"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Confirm Purge
              </Button>
              <Button variant="ghost" className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600" onClick={() => setConfirmModal(null)}>Abort</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
