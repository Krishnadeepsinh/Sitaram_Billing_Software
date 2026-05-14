import React, { useState, useEffect } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, Save, Loader2, Globe, Phone, Mail, 
  MapPin, Receipt, Shield, Activity, Zap, DatabaseZap,
  Globe2, ShieldCheck, Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
      toast.success('System Configuration Updated');
    } catch (error) {
      toast.error('Sync Failure');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20 relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-5 pointer-events-none">
        <Fingerprint className="h-[500px] w-[500px] text-blue-500 blur-2xl" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-8">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-indigo-400">
            <Shield className="h-3.5 w-3.5" />
            System configuration
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl relative z-10">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-slate-900 rounded-xl border border-white/10 relative overflow-hidden group">
            {/* Header section of the panel */}
            <div className="flex items-center gap-6 p-8 border-b border-white/10 bg-slate-900/50">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-600/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Business Details</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                   <Activity className="h-3.5 w-3.5 text-indigo-500" /> Identity & Global Billing Protocols
                </p>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 group/field">
                  <label className="text-xs font-semibold text-slate-400 group-focus-within/field:text-indigo-400 transition-colors">Legal Asset Alias</label>
                  <div className="relative">
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="h-11 rounded-lg bg-slate-950 border-white/10 pl-11 text-sm font-medium text-white focus-visible:border-indigo-500/50 focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all"
                      placeholder="Company Name"
                    />
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2 group/field">
                  <label className="text-xs font-semibold text-slate-400 group-focus-within/field:text-indigo-400 transition-colors">Digital Yield Address (UPI)</label>
                  <div className="relative">
                    <Input 
                      value={formData.upiId} 
                      onChange={e => setFormData({...formData, upiId: e.target.value})}
                      className="h-11 rounded-lg bg-slate-950 border-white/10 pl-11 text-sm font-medium text-indigo-300 focus-visible:border-indigo-500/50 focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all"
                      placeholder="UPI ID"
                    />
                    <Globe2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2 group/field">
                  <label className="text-xs font-semibold text-slate-400 group-focus-within/field:text-indigo-400 transition-colors">Terminal Comms (Phone)</label>
                  <div className="relative">
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="h-11 rounded-lg bg-slate-950 border-white/10 pl-11 text-sm font-medium text-white focus-visible:border-indigo-500/50 focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all"
                      placeholder="Phone Number"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                  </div>
                </div>

                <div className="space-y-2 group/field">
                  <label className="text-xs font-semibold text-slate-400 group-focus-within/field:text-indigo-400 transition-colors">Network Dispatch Email</label>
                  <div className="relative">
                    <Input 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="h-11 rounded-lg bg-slate-950 border-white/10 pl-11 text-sm font-medium text-white focus-visible:border-indigo-500/50 focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all"
                      placeholder="Email Address"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2 group/field">
                  <label className="text-xs font-semibold text-slate-400 group-focus-within/field:text-indigo-400 transition-colors">Geographic Root Address</label>
                  <div className="relative">
                    <textarea 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full min-h-[100px] rounded-lg bg-slate-950 border border-white/10 text-white p-4 pl-11 text-sm font-medium outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Business Address"
                    />
                    <MapPin className="absolute left-3.5 top-4 h-4 w-4 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end border-t border-white/10 mt-8">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-10 rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-700 active:scale-95 border border-indigo-400/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
