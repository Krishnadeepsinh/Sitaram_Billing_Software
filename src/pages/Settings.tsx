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
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-primary/30 selection:text-white pb-20">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-16">
        {/* Header Section */}
        <div className="space-y-4 mb-16">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="h-1 w-12 bg-slate-800 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">System Configuration</span>
          </div>
          <h1 className="font-display text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
            System <span className="text-primary italic">Settings</span>
          </h1>
          <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
            Configure your business details and branding. These details will appear on all generated invoices.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] border border-slate-800 shadow-2xl shadow-black/40 p-10 lg:p-12 space-y-12">
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800/50">
              <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.25em] font-black text-white">Organization Profile</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-widest">Master Identity Record</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 group-focus-within:text-primary transition-colors">Company Name</label>
                <div className="relative">
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-950 border-slate-800 text-white pl-14 font-bold focus:ring-primary/20 transition-all border-2 focus:border-primary"
                  />
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 group-focus-within:text-primary transition-colors">UPI ID for Payments</label>
                <div className="relative">
                  <Input 
                    value={formData.upiId} 
                    onChange={e => setFormData({...formData, upiId: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-950 border-slate-800 text-white pl-14 font-bold focus:ring-primary/20 transition-all border-2 focus:border-primary"
                  />
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 group-focus-within:text-primary transition-colors">Phone Number</label>
                <div className="relative">
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-950 border-slate-800 text-white pl-14 font-bold focus:ring-primary/20 transition-all border-2 focus:border-primary"
                  />
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 group-focus-within:text-primary transition-colors">Support Email</label>
                <div className="relative">
                  <Input 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-950 border-slate-800 text-white pl-14 font-bold focus:ring-primary/20 transition-all border-2 focus:border-primary"
                  />
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-3 group">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1 group-focus-within:text-primary transition-colors">Business Address</label>
                <div className="relative">
                  <textarea 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full min-h-[140px] rounded-2xl bg-slate-950 border-slate-800 text-white p-5 pl-14 font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all border-2 focus:border-primary"
                  />
                  <MapPin className="absolute left-5 top-6 h-5 w-5 text-slate-600 group-focus-within:text-primary transition-colors" />
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Committing Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-3 h-5 w-5" />
                    Save Configuration
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
