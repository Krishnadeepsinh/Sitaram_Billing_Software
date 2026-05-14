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
    setFormData(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      toast.success("Configuration committed successfully");
    } catch (err) {
      toast.error("Failed to commit configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
            Business <span className="text-primary italic">Settings</span>
          </h1>
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
            Manage your company details and invoice branding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-8 transition-all hover:border-primary/10">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900">Organization Profile</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Legal Company Name</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="SITARAM CABLE & BROADBAND" 
                  className="rounded-xl bg-slate-50 border-transparent h-14 text-sm font-bold focus:bg-white focus:ring-primary/10 transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Physical Business Address</label>
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Street, City, State, ZIP"
                  className="w-full bg-slate-50 border border-transparent rounded-xl p-5 outline-none text-sm font-bold min-h-[120px] focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-8 transition-all hover:border-emerald-100">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Wallet className="h-4 w-4" />
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-900">Payment Gateways & Contact</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Primary UPI ID</label>
                <Input 
                  value={formData.upiId} 
                  onChange={e => setFormData({...formData, upiId: e.target.value})}
                  placeholder="9825039825@ybl" 
                  className="rounded-xl bg-slate-50 border-transparent h-14 text-sm font-bold focus:bg-white focus:ring-primary/10 transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 ml-1">Customer Support Hotline</label>
                <Input 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210" 
                  className="rounded-xl bg-slate-50 border-transparent h-14 text-sm font-bold focus:bg-white focus:ring-primary/10 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform pointer-events-none text-primary"><Save className="h-40 w-40" /></div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 mb-4">Commit Changes</h3>
            <p className="text-[11px] text-slate-500 mb-10 leading-relaxed font-bold uppercase tracking-wider">Update your digital identity and billing infrastructure across the entire platform.</p>
            <Button 
              disabled={isSaving}
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-16 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save Configuration
            </Button>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200/50">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Deployment Status
            </h4>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Changes to company details are reflected on all **live** invoices and receipts immediately upon saving.</p>
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-200/50">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Please verify your **UPI ID** twice. Incorrect entries will result in payment collection failures.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-primary/10 shadow-sm">
            <h4 className="text-[10px] uppercase tracking-[0.25em] font-black text-primary mb-3">Disaster Recovery</h4>
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed font-medium">Ensure your business continuity by performing regular system-wide data backups.</p>
            <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" asChild>
              <Link to="/backup">Access Backup Tools</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
