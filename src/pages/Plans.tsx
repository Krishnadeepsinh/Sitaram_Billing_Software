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
      const payload = { ...formData, priceWithoutGst: formData.price };
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your subscription packages and pricing.</p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Plan
        </Button>
      </div>

      {/* Plans Table */}
      <div className="data-table">
        <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-5 py-3">
          <p className="text-sm font-semibold text-foreground">Active Plans</p>
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {plans.length} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{isCableMode ? "Units" : "Speed"}</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subscribers</th>
                <th className="px-5 py-3 w-32 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                        <Network className="h-7 w-7 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No plans yet</p>
                      <p className="text-xs text-muted-foreground">Add your first plan to get started</p>
                      <Button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 text-white mt-1">Add Plan</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                plans.map((p) => {
                  const count = subscribers.filter((s) => s.planId === p.id).length;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                            <Network className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.providerPlanId || "Default"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-orange-500 font-mono-num">{formatCurrency(p.price)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{p.validityDays} days</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Signal className="h-3.5 w-3.5" />
                          <span>{isCableMode ? `${p.speedMbps} Units` : `${p.speedMbps} Mbps`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", count > 0 ? "bg-green-500" : "bg-border")} />
                          <span className="text-sm text-muted-foreground">{count} active</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-muted-foreground flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmModal({ type: 'delete', id: p.id })}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 text-muted-foreground flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-foreground">{editingPlan ? "Edit Plan" : "Create New Plan"}</h2>
              <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Plan Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Standard 100Mbps"
                  className="h-10 bg-secondary/50 border-border focus:ring-orange-500/20 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Monthly Price (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                    <Input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="h-10 pl-7 bg-secondary/50 border-border focus:ring-orange-500/20 rounded-xl font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Validity (Days)</Label>
                  <Input
                    type="number"
                    value={formData.validityDays || ''}
                    onChange={(e) => setFormData({ ...formData, validityDays: Number(e.target.value) })}
                    className="h-10 bg-secondary/50 border-border focus:ring-orange-500/20 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {isCableMode ? "Units" : "Speed (Mbps)"}
                  </Label>
                  <Input
                    type="number"
                    value={formData.speedMbps || ''}
                    onChange={(e) => setFormData({ ...formData, speedMbps: Number(e.target.value) })}
                    className="h-10 bg-secondary/50 border-border focus:ring-orange-500/20 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Provider Code (Optional)</Label>
                  <Input
                    value={formData.providerPlanId}
                    onChange={(e) => setFormData({ ...formData, providerPlanId: e.target.value })}
                    placeholder="ISP Code"
                    className="h-10 bg-secondary/50 border-border focus:ring-orange-500/20 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3 bg-secondary/10 flex-shrink-0">
              <Button variant="outline" className="flex-1 h-11 font-semibold" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || isSaving}
                className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Delete Plan?</h3>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Subscribers on this plan will need to be manually reassigned.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 bg-secondary/10">
              <Button variant="outline" className="flex-1 h-10 font-semibold" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-bold"
                onClick={() => { executeDelete(confirmModal.id); setConfirmModal(null); }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
