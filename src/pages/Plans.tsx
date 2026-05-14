import { useState } from "react";
import { formatCurrency } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Wifi, Edit2, Trash2, Loader2 } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { Input } from "@/components/ui/input";
import { useBusinessMode } from "@/lib/turso";

export default function Plans() {
  const activeBusinessMode = useBusinessMode();
  const isCableMode = activeBusinessMode === "cable";
  const { subscribers, plans, addPlan, updatePlan, deletePlan } = useBilling();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', price: 0, validityDays: 30, speedMbps: 100, priceWithoutGst: 0, providerPlanId: '', category: 'welcome' as 'welcome' | 'renewal' | 'iptv' });
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{type: 'delete', id: string} | null>(null);

  const categoryLabel: Record<string, string> = {
    welcome: "Welcome",
    renewal: "Renewal",
    iptv: "IPTV Bundle",
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({ name: '', price: 0, validityDays: 30, speedMbps: 100, priceWithoutGst: 0, providerPlanId: '', category: 'welcome' });
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
      category: plan.category || 'welcome'
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
      toast.success(editingPlan ? "Plan updated" : "Plan created");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({ type: 'delete', id });
  };

  const executeDelete = async (id: string) => {
    try {
      await deletePlan(id);
      toast.success("Plan deleted successfully");
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-500 font-black mb-2 flex items-center gap-2">
            <Wifi className="h-3 w-3" />
            Infrastructure · Service Tiers
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            Service <span className="text-indigo-500 italic">Plans</span>
          </h1>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            Manage {isCableMode ? "cable packages" : "broadband plans"} and pricing parameters.
          </p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="h-14 bg-indigo-500 text-white hover:bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 px-8 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" /> New Service Tier
        </Button>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black border-b border-slate-100">
                <th className="px-8 py-6">Plan Identity</th>
                {!isCableMode && <th className="px-8 py-6">Category</th>}
                <th className="px-8 py-6">Unit Price</th>
                <th className="px-8 py-6">Cycle / Validity</th>
                <th className="px-8 py-6">{isCableMode ? "Channels" : "Bandwidth"}</th>
                <th className="px-8 py-6">Active Node Count</th>
                <th className="px-8 py-6 text-right w-32">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {plans.map((p) => {
                const count = subscribers.filter((s) => s.planId === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Wifi className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 truncate uppercase tracking-tight">{p.name}</p>
                          {!isCableMode && p.providerPlanId && (
                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">EXTERNAL_ID: {p.providerPlanId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {!isCableMode && (
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          {categoryLabel[p.category || "welcome"]}
                        </span>
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <span className="font-black text-sm text-slate-900 tabular-nums">{formatCurrency(p.price)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {p.validityDays >= 360 ? "12 Months" : p.validityDays >= 180 ? "6 Months" : `${p.validityDays} Days`}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        {isCableMode ? `${p.speedMbps} Units` : `${p.speedMbps} Mbps`}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-black text-xs text-slate-600 tabular-nums">{count} Subscribers</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all" onClick={() => handleOpenEdit(p)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={isCableMode ? 6 : 7} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                      <Wifi className="h-12 w-12 text-slate-400" />
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No service tiers defined</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-indigo-500 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Wifi className="h-6 w-6" />
                {editingPlan ? 'Edit Configuration' : 'New Service Tier'}
              </h2>
              <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mt-2">Adjust architectural parameters</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Plan Descriptor</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder={isCableMode ? "e.g. Basic Pack" : "e.g. 50 Mbps Unlimited"} 
                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500/10 font-bold transition-all"
                />
              </div>

              {!isCableMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Classification</Label>
                    <select
                      className="w-full h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500/10 font-bold transition-all px-4 text-sm appearance-none cursor-pointer"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as 'welcome' | 'renewal' | 'iptv'})}
                    >
                      <option value="welcome">Welcome</option>
                      <option value="renewal">Renewal</option>
                      <option value="iptv">IPTV Bundle</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">External Code</Label>
                    <Input 
                      value={formData.providerPlanId} 
                      onChange={e => setFormData({...formData, providerPlanId: e.target.value})} 
                      className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500/10 font-bold transition-all"
                      placeholder="PROVIDER_ID"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Unit Price (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">Validity (Days)</Label>
                  <Input 
                    type="number" 
                    value={formData.validityDays} 
                    onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} 
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500/10 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 ml-1">
                  {isCableMode ? "Payload Units (Channels)" : "Throughput Rate (Mbps)"}
                </Label>
                <Input 
                  type="number" 
                  value={formData.speedMbps} 
                  onChange={e => setFormData({...formData, speedMbps: Number(e.target.value)})} 
                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-indigo-500/10 font-bold transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="ghost" className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button 
                  disabled={isSaving}
                  className="flex-1 h-12 bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20" 
                  onClick={handleSave}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Logic"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">Delete Procedure</h2>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-8 leading-relaxed">
              This will permanently purge this service tier from the registry. Nodes assigned to this plan will require immediate reassignment.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest" onClick={() => setConfirmModal(null)}>Abort</Button>
              <Button 
                className="h-12 px-8 bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Confirm Purge
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
