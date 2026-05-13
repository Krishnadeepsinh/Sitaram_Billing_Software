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
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({ type: 'delete', id });
  };

  const executeDelete = async (id: string) => {
    await deletePlan(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Plans & Packages</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your {isCableMode ? "cable packages" : "broadband plans"} and pricing</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" /> New Plan
        </Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-border/60 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-[10px] uppercase tracking-widest text-muted-foreground font-bold border-b border-border/60">
                <th className="px-4 py-4 font-bold">Plan Name</th>
                {!isCableMode && <th className="px-4 py-4 font-bold">Type</th>}
                {!isCableMode && <th className="px-4 py-4 font-bold">Provider Plan ID</th>}
                <th className="px-4 py-4 font-bold">Price</th>
                <th className="px-4 py-4 font-bold">Validity</th>
                <th className="px-4 py-4 font-bold">{isCableMode ? "Channels" : "Speed"}</th>
                <th className="px-4 py-4 font-bold">Subscribers</th>
                <th className="px-4 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {plans.map((p) => {
                const count = subscribers.filter((s) => s.planId === p.id).length;
                return (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Wifi className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{p.name}</span>
                          {!isCableMode && p.providerPlanId && (
                            <span className="text-[10px] text-muted-foreground">Plan ID: {p.providerPlanId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    {!isCableMode && (
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                          {categoryLabel[p.category || "welcome"]}
                        </span>
                      </td>
                    )}
                    {!isCableMode && (
                      <td className="px-4 py-4">
                        <span className="font-mono-num text-xs font-semibold">{p.providerPlanId || "-"}</span>
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className="font-mono-num font-bold text-sm">{formatCurrency(p.price)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-muted-foreground">{p.validityDays >= 360 ? "12 Months" : p.validityDays >= 180 ? "6 Months" : `${p.validityDays} Days`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs">{isCableMode ? `${p.speedMbps} Channels` : `${p.speedMbps} Mbps`}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono-num text-xs font-semibold">{count}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handleOpenEdit(p)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">Plan Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={isCableMode ? "e.g. Basic Pack" : "e.g. 50 Mbps Unlimited"} />
              </div>
              {!isCableMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-1 block">Plan Type</label>
                    <select
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as 'welcome' | 'renewal' | 'iptv'})}
                    >
                      <option value="welcome">Welcome</option>
                      <option value="renewal">Renewal</option>
                      <option value="iptv">IPTV Bundle</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase mb-1 block">Provider Plan ID</label>
                    <Input value={formData.providerPlanId} onChange={e => setFormData({...formData, providerPlanId: e.target.value})} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">Price</label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">Validity (Days)</label>
                  <Input type="number" value={formData.validityDays} onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase mb-1 block">{isCableMode ? "Channels Count" : "Speed (Mbps)"}</label>
                <Input type="number" value={formData.speedMbps} onChange={e => setFormData({...formData, speedMbps: Number(e.target.value)})} />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button 
                  disabled={isSaving}
                  className="flex-1 bg-gradient-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20" 
                  onClick={handleSave}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Plan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white text-black w-full max-w-md p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-2">Delete Plan</h2>
            <p className="text-slate-600 mb-6 font-medium">
              Are you sure you want to delete this plan?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl border-slate-200 bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button 
                variant="destructive" 
                className="rounded-xl"
                onClick={() => {
                  executeDelete(confirmModal.id);
                  setConfirmModal(null);
                }}
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

