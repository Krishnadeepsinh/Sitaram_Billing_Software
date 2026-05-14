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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">SYSTEM_CONFIG_PROTOCOL</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Enterprise Identity & Parameters</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-800 shadow-2xl p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800/50">
              <div className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-[10px] uppercase tracking-[0.25em] font-black text-white">ORGANIZATION_IDENTITY_RECORD</h2>
                <p className="text-[8px] text-slate-600 font-bold uppercase mt-0.5 tracking-[0.2em]">Master Branding Parameters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-blue-500 transition-colors">CORP_LEGAL_NAME</label>
                <div className="relative">
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-9 rounded-lg bg-slate-950 border-slate-800 text-slate-100 pl-10 text-[11px] font-bold focus:ring-blue-600/20 transition-all border focus:border-blue-600 placeholder:text-slate-800"
                  />
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-blue-500 transition-colors">FIN_UPI_GATEWAY_ID</label>
                <div className="relative">
                  <Input 
                    value={formData.upiId} 
                    onChange={e => setFormData({...formData, upiId: e.target.value})}
                    className="h-9 rounded-lg bg-slate-950 border-slate-800 text-slate-100 pl-10 text-[11px] font-bold focus:ring-blue-600/20 transition-all border focus:border-blue-600 placeholder:text-slate-800"
                  />
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-blue-500 transition-colors">PRIMARY_COMM_TERMINAL</label>
                <div className="relative">
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="h-9 rounded-lg bg-slate-950 border-slate-800 text-slate-100 pl-10 text-[11px] font-bold focus:ring-blue-600/20 transition-all border focus:border-blue-600 placeholder:text-slate-800"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-blue-500 transition-colors">SUPPORT_DATA_NODE</label>
                <div className="relative">
                  <Input 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="h-9 rounded-lg bg-slate-950 border-slate-800 text-slate-100 pl-10 text-[11px] font-bold focus:ring-blue-600/20 transition-all border focus:border-blue-600 placeholder:text-slate-800"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5 group">
                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1 group-focus-within:text-blue-500 transition-colors">PHYSICAL_LOCATION_DATA</label>
                <div className="relative">
                  <textarea 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full min-h-[80px] rounded-lg bg-slate-950 border-slate-800 text-slate-100 p-3 pl-10 text-[11px] font-bold outline-none focus:ring-1 focus:ring-blue-600/20 transition-all border focus:border-blue-600 placeholder:text-slate-800"
                  />
                  <MapPin className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="h-9 px-8 rounded-lg bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    COMMITTING_CHANGES...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3.5 w-3.5" />
                    SYNC_CONFIGURATION
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
