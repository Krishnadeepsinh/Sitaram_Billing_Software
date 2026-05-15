import React, { useState, useEffect } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, Phone, Mail, MapPin, Globe2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { companySettings, updateCompanySettings } = useBilling();
  const [formData, setFormData] = useState({ name: '', address: '', upiId: '', phone: '', email: '', gstin: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (companySettings) {
      setFormData({
        name: companySettings.name || '',
        address: companySettings.address || '',
        upiId: companySettings.upiId || '',
        phone: companySettings.phone || '',
        email: companySettings.email || '',
        gstin: companySettings.gstin || ''
      });
    }
  }, [companySettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCompanySettings(formData);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your business profile and billing configuration.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        <div className="app-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />Business Details
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Company identity and contact information.</p>
            <div className="h-px bg-border mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="pl-9 h-9 bg-input border-border rounded-lg" placeholder="Company Name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">UPI ID</label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})}
                  className="pl-9 h-9 bg-input border-border rounded-lg" placeholder="yourname@upi" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="pl-9 h-9 bg-input border-border rounded-lg" placeholder="Phone Number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="pl-9 h-9 bg-input border-border rounded-lg" placeholder="Email Address" />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full min-h-[90px] rounded-lg bg-input border border-border text-foreground text-sm p-3 pl-9 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                  placeholder="Business Address" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><ShieldCheck className="mr-2 h-4 w-4" />Save Settings</>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
