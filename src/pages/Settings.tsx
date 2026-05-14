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

      {/* Industrial Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-b border-white/5 pb-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 w-fit backdrop-blur-3xl shadow-xl shadow-blue-600/5">
            <Shield className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">System Parameters</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
            Node <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800">Configuration</span>
          </h1>
          <p className="text-sm font-black text-slate-500 tracking-[0.2em] uppercase flex items-center gap-3">
            <DatabaseZap className="h-4 w-4" /> Identity & Global Billing Protocols
          </p>
        </div>
      </div>

      <div className="max-w-4xl relative z-10">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="app-panel border border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group rounded-[3rem]">
            {/* Header section of the panel */}
            <div className="flex items-center gap-6 p-10 border-b border-white/5 bg-slate-950/30">
              <div className="h-16 w-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-600/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Entity Identity</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
                   <Activity className="h-3 w-3 text-blue-500" /> SYSTEM_ROOT_METADATA
                </p>
              </div>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 group/field">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 group-focus-within/field:text-blue-500 transition-colors">Legal Asset Alias</label>
                  <div className="relative">
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 pl-12 text-[13px] font-black tracking-widest text-white uppercase focus-visible:border-blue-500/50 shadow-inner transition-all"
                      placeholder="COMPANY_LEGAL_ID"
                    />
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within/field:text-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3 group/field">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 group-focus-within/field:text-blue-500 transition-colors">Digital Yield Address (UPI)</label>
                  <div className="relative">
                    <Input 
                      value={formData.upiId} 
                      onChange={e => setFormData({...formData, upiId: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 pl-12 text-[13px] font-black tracking-widest text-blue-400 focus-visible:border-blue-500/50 shadow-inner transition-all italic"
                      placeholder="ASSET_SETTLEMENT_ID"
                    />
                    <Globe2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within/field:text-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3 group/field">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 group-focus-within/field:text-blue-500 transition-colors">Terminal Comms (Phone)</label>
                  <div className="relative">
                    <Input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 pl-12 text-[13px] font-black tracking-[0.3em] text-white focus-visible:border-blue-500/50 shadow-inner transition-all"
                      placeholder="+91 HARDWARE_LINK"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within/field:text-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="space-y-3 group/field">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 group-focus-within/field:text-blue-500 transition-colors">Network Dispatch Email</label>
                  <div className="relative">
                    <Input 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="h-14 rounded-2xl bg-slate-950 border-white/5 pl-12 text-[13px] font-black tracking-widest text-white focus-visible:border-blue-500/50 shadow-inner transition-all"
                      placeholder="DISPATCH_CHANNEL"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700 group-focus-within/field:text-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3 group/field">
                  <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 ml-2 group-focus-within/field:text-blue-500 transition-colors">Geographic Root Address</label>
                  <div className="relative">
                    <textarea 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full min-h-[120px] rounded-[2rem] bg-slate-950 border border-white/5 text-white p-6 pl-12 text-[13px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all shadow-inner"
                      placeholder="PHYSICAL_LOCATION_DATA..."
                    />
                    <MapPin className="absolute left-4 top-6 h-4 w-4 text-slate-700 group-focus-within/field:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end border-t border-white/5 mt-10">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="h-16 rounded-[2rem] bg-blue-600 px-12 text-[11px] font-black uppercase tracking-[0.4em] text-white shadow-2xl shadow-blue-600/40 transition-all hover:bg-blue-500 active:scale-95 border border-blue-400/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Commiting_Sync…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-3 h-6 w-6" />
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
