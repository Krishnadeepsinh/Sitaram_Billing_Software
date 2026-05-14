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
      toast.success(editingPlan ? "Plan updated" : "Plan added");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deletePlan(id);
      toast.success("Plan removed");
    } catch (err) {
      toast.error("Operation Failed");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="app-eyebrow mb-1 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-blue-500" />
            Service plans
          </p>
          <h1 className="app-page-title">Plans & pricing</h1>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" /> Add plan
        </Button>
      </div>

      <div className="app-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-4 py-2.5">
          <p className="text-xs font-medium text-slate-400">Active plans</p>
          <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">{plans.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="app-table-th px-4 py-2.5">Plan</th>
                <th className="app-table-th px-4 py-2.5">Price</th>
                <th className="app-table-th px-4 py-2.5">Cycle</th>
                <th className="app-table-th px-4 py-2.5">{isCableMode ? "Units" : "Speed"}</th>
                <th className="app-table-th px-4 py-2.5">Subscribers</th>
                <th className="app-table-th px-4 py-2.5 text-right">Actions</th>
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
                          <span className="text-xs font-semibold tracking-tight text-white">{p.name}</span>
                          <span className="mt-1 text-[11px] font-medium text-slate-500">ID: {p.providerPlanId || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-blue-400">{formatCurrency(p.price)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-400">
                        {p.validityDays} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium tabular-nums text-slate-200">
                        {isCableMode ? `${p.speedMbps} unit` : `${p.speedMbps} Mbps`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1 w-1 rounded-full", count > 0 ? "bg-blue-500 shadow-[0_0_8px_hsl(220_26%_48%/0.45)]" : "bg-slate-800")} />
                        <span className="text-xs font-medium text-slate-400">{count} on plan</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg animate-in zoom-in-95 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl duration-200">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-white">{editingPlan ? "Edit plan" : "New plan"}</h2>
                <p className="mt-1 text-sm text-slate-500">Set how this plan appears on invoices and renewals.</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-400">Plan name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Fiber 200" 
                  className="h-10 rounded-lg border-slate-800 bg-slate-950 text-sm text-white focus-visible:border-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400">Price (INR)</Label>
                  <Input 
                    type="number" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    className="h-10 rounded-lg border-slate-800 bg-slate-950 font-mono text-sm text-white focus-visible:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400">Validity (days)</Label>
                  <Input 
                    type="number" 
                    value={formData.validityDays || ''} 
                    onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} 
                    className="h-10 rounded-lg border-slate-800 bg-slate-950 text-sm text-white focus-visible:border-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400">
                    {isCableMode ? "Units" : "Speed (Mbps)"}
                  </Label>
                  <Input 
                    type="number" 
                    value={formData.speedMbps || ''} 
                    onChange={e => setFormData({...formData, speedMbps: Number(e.target.value)})} 
                    className="h-10 rounded-lg border-slate-800 bg-slate-950 text-sm text-white focus-visible:border-blue-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-400">Provider reference</Label>
                  <Input 
                    value={formData.providerPlanId} 
                    onChange={e => setFormData({...formData, providerPlanId: e.target.value})} 
                    className="h-10 rounded-lg border-slate-800 bg-slate-950 font-mono text-sm text-slate-300 focus-visible:border-blue-500/40"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-400">Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as "welcome" | "renewal" | "iptv",
                    })
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                  {(Object.keys(categoryLabel) as (keyof typeof categoryLabel)[]).map((k) => (
                    <option key={k} value={k}>
                      {categoryLabel[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="ghost" className="h-10 flex-1 rounded-lg text-sm font-medium text-slate-400 hover:text-white" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-500"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                Save plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl">
          <div className="w-full max-w-sm animate-in zoom-in-95 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-white shadow-2xl duration-200">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-400">
              <Trash2 className="h-7 w-7" />
            </div>
            <h2 className="font-display text-lg font-semibold">Delete this plan?</h2>
            <p className="mb-8 mt-2 text-sm text-slate-400">
              Subscribers on this plan may need to be moved to another plan first.
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="destructive" 
                className="h-10 rounded-lg bg-rose-600 text-sm font-medium shadow-md shadow-rose-600/20 hover:bg-rose-500"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
              >
                Delete plan
              </Button>
              <Button variant="ghost" className="h-10 rounded-lg text-sm font-medium text-slate-500 hover:text-white" onClick={() => setConfirmModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
