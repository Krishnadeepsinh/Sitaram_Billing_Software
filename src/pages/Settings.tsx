import React, { useState, useEffect } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Receipt, Wallet, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { companySettings, updateCompanySettings, isLoading } = useBilling();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    upiId: '',
    phone: '',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (companySettings) {
      setFormData({
        name: companySettings.name || '',
        address: companySettings.address || '',
        upiId: companySettings.upiId || '',
        phone: companySettings.phone || '',
        email: companySettings.email || ''
      });
    }
  }, [companySettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCompanySettings(formData);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="h-10 w-10 text-primary" />
            Company Settings
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage your business details and invoice branding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-8 rounded-3xl space-y-6 border-border/40">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Receipt className="h-4 w-4 text-primary" />
              <h2 className="text-xs uppercase tracking-widest font-black text-muted-foreground">Business Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Company Name</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="SITARAM CABLE & BROADBAND" 
                  className="rounded-xl bg-secondary/30 h-12"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Address</label>
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Street, City, State, ZIP"
                  className="w-full bg-secondary/30 border border-border rounded-xl p-4 outline-none text-sm min-h-[100px] focus:border-primary/40 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-6 border-border/40">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <h2 className="text-xs uppercase tracking-widest font-black text-muted-foreground">Payment & Billing</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">UPI ID for Invoices</label>
                <Input 
                  value={formData.upiId} 
                  onChange={e => setFormData({...formData, upiId: e.target.value})}
                  placeholder="9825039825@ybl" 
                  className="rounded-xl bg-secondary/30 h-12"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Support Phone</label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210" 
                  className="rounded-xl bg-secondary/30 h-12"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl bg-gradient-primary text-primary-foreground border-none">
            <h3 className="text-lg font-bold mb-2">Save Changes</h3>
            <p className="text-xs opacity-80 mb-6 leading-relaxed">Your company details will be reflected on all digital invoices and receipts instantly.</p>
            <Button 
              disabled={isSaving}
              onClick={handleSave}
              className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              Save Configuration
            </Button>
          </div>

          <div className="glass-card p-6 rounded-3xl border-border/40 bg-secondary/20">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-4">Invoice Preview Tip</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Ensure UPI ID is correct to avoid payment collection issues.</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/5">
            <h4 className="text-[10px] uppercase tracking-widest font-black text-primary mb-2">Data Management</h4>
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">Secure your business data by taking manual backups regularly.</p>
            <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10 h-10 text-xs" asChild>
              <Link to="/backup">Manual Backup & Restore</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

