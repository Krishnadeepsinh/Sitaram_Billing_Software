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
      toast.success("Plan deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plans</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your subscription packages and pricing.</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Plan
        </Button>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3">
          <p className="text-sm font-semibold text-slate-700">Active Plans</p>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {plans.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{isCableMode ? "Units" : "Speed"}</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscribers</th>
                <th className="px-6 py-3 w-40 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((p) => {
                const count = subscribers.filter((s) => s.planId === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500">
                          <Network className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800">{p.name}</span>
                          <span className="mt-0.5 text-xs text-slate-400">{p.providerPlanId || "Default"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-orange-600 font-mono tabular-nums">{formatCurrency(p.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="tabular-nums">{p.validityDays} Days</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Signal className="h-3.5 w-3.5 text-slate-400" />
                        <span className="tabular-nums">{isCableMode ? `${p.speedMbps} Units` : `${p.speedMbps} Mbps`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full", count > 0 ? "bg-green-500" : "bg-slate-300")} />
                        <span className="text-sm text-slate-600">{count} Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50" onClick={() => handleOpenEdit(p)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => setConfirmModal({ type: 'delete', id: p.id })}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Wifi className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{editingPlan ? "Edit Plan" : "New Plan"}</h2>
                  <p className="text-sm text-slate-500">Configure plan details and pricing</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500">Plan Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Standard 100Mbps" 
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus-visible:border-orange-400 focus-visible:ring-1 focus-visible:ring-orange-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Price (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus-visible:border-orange-400 focus-visible:ring-1 focus-visible:ring-orange-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Validity (Days)</Label>
                  <Input 
                    type="number" 
                    value={formData.validityDays || ''} 
                    onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} 
                    className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus-visible:border-orange-400 focus-visible:ring-1 focus-visible:ring-orange-400 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">
                    {isCableMode ? "Units" : "Speed (Mbps)"}
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.speedMbps || ''} 
                    onChange={e => setFormData({...formData, speedMbps: Number(e.target.value)})} 
                    className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus-visible:border-orange-400 focus-visible:ring-1 focus-visible:ring-orange-400 tabular-nums"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Plan Code (Optional)</Label>
                  <Input 
                    value={formData.providerPlanId} 
                    onChange={e => setFormData({...formData, providerPlanId: e.target.value})} 
                    placeholder="ISP Code" 
                    className="h-11 rounded-lg border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 focus-visible:border-orange-400 focus-visible:ring-1 focus-visible:ring-orange-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <Button variant="ghost" onClick={() => setShowModal(false)} className="h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-50">Cancel</Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!formData.name || isSaving}
                  className="h-10 bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-lg"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Plan?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This action cannot be undone. Any subscribers currently on this plan will need to be reassigned.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmModal(null)} className="h-10 text-slate-500 hover:bg-slate-50">Cancel</Button>
              <Button 
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }} 
                className="h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Delete Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
