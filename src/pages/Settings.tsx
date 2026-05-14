import React, { useState, useEffect } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Save, Loader2, Globe, Phone, Mail, MapPin, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { companySettings, updateCompanySettings } = useBilling();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            System <span className="text-primary italic">Settings</span>
          </h1>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            Configure your business details and branding.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Building2 className="h-4 w-4" />
            </div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900">Organization Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Company Name</label>
              <div className="relative">
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl bg-slate-50 border-transparent h-14 pl-12 text-sm font-bold"
                />
                <Building2 className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">UPI ID for Payments</label>
              <div className="relative">
                <Input 
                  value={formData.upiId} 
                  onChange={e => setFormData({...formData, upiId: e.target.value})}
                  className="rounded-xl bg-slate-50 border-transparent h-14 pl-12 text-sm font-bold"
                />
                <Globe className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Phone Number</label>
              <div className="relative">
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="rounded-xl bg-slate-50 border-transparent h-14 pl-12 text-sm font-bold"
                />
                <Phone className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Support Email</label>
              <div className="relative">
                <Input 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="rounded-xl bg-slate-50 border-transparent h-14 pl-12 text-sm font-bold"
                />
                <Mail className="absolute left-4 top-4.5 h-5 w-5 text-slate-300" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Business Address</label>
              <div className="relative">
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full min-h-[120px] rounded-xl bg-slate-50 border-transparent p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;
