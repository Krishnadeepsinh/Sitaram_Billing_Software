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
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_hsl(220_26%_38%/0.12)]">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-white">Settings</h1>
            <p className="mt-0.5 text-sm text-slate-500">Company profile used on invoices and receipts</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-800 shadow-2xl p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800/50">
              <div className="h-9 w-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Business details</h2>
                <p className="text-xs text-slate-500">Shown to customers on PDFs and messages</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 group">
                <label className="ml-1 text-xs font-medium text-slate-400 transition-colors group-focus-within:text-blue-400">Legal business name</label>
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
                <label className="ml-1 text-xs font-medium text-slate-400 transition-colors group-focus-within:text-blue-400">UPI ID</label>
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
                <label className="ml-1 text-xs font-medium text-slate-400 transition-colors group-focus-within:text-blue-400">Phone</label>
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
                <label className="ml-1 text-xs font-medium text-slate-400 transition-colors group-focus-within:text-blue-400">Email</label>
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
                <label className="ml-1 text-xs font-medium text-slate-400 transition-colors group-focus-within:text-blue-400">Address</label>
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
                className="h-10 rounded-lg bg-blue-600 px-8 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
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
