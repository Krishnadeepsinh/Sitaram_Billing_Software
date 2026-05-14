import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, AlertTriangle, FileJson, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { useBusinessMode } from '@/lib/turso';
import { toast } from 'sonner';

export default function Backup() {
  const { subscribers, payments, invoices, expenses, reminders, agents, plans, companySettings, importBackupData } = useBilling();
  const activeBusinessMode = useBusinessMode();
  const activeBusinessLabel = activeBusinessMode === 'cable' ? 'Cable' : 'Broadband';
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    const sanitizedSubscribers = subscribers.map((subscriber) => (
      activeBusinessMode === 'broadband'
        ? { ...subscriber, customerPassword: '' }
        : subscriber
    ));

    const backupData = {
      subscribers: sanitizedSubscribers,
      payments,
      invoices,
      expenses,
      reminders,
      agents,
      plans,
      companySettings,
      version: '1.0',
      timestamp: new Date().toISOString(),
      businessMode: activeBusinessMode,
      passwordExported: false
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBusinessLabel}_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded successfully without customer passwords');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Importing a backup will OVERWRITE all current data. Are you sure you want to proceed?')) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // Basic validation
        if (!data.subscribers || !data.payments) {
          throw new Error('Invalid backup file format');
        }

        await importBackupData(data);
        toast.success('Backup restored successfully');
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Failed to restore backup');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-black mb-2 flex items-center gap-2">
          <Database className="h-3 w-3" />
          Infrastructure · Disaster Recovery
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">
          Manual <span className="text-primary italic">Backups</span>
        </h1>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
          Secure your data by creating local snapshots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform pointer-events-none text-primary">
            <Download className="w-64 h-64" />
          </div>
          
          <div className="relative space-y-8">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Download className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Snapshot Data</h2>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                Generate a secure JSON snapshot of your entire database. Includes subscribers, invoices, 
                payments, and configuration settings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black mb-1">Last Export</p>
                <p className="text-xs font-black text-slate-900">SYSTEM_INIT</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-black mb-1">Index Volume</p>
                <p className="text-xs font-black text-slate-900">{(subscribers.length + payments.length + invoices.length + expenses.length + agents.length).toLocaleString()} BLOCKS</p>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Download className="h-4 w-4" /> Initialize Export
            </Button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-100 transition-all">
          <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform pointer-events-none text-amber-500">
            <Upload className="w-64 h-64" />
          </div>
          
          <div className="relative space-y-8">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-100/50 flex items-center justify-center">
              <Upload className="h-6 w-6 text-amber-400 group-hover:text-amber-600 transition-colors" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Restore Point</h2>
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider leading-relaxed">
                Upload a previously exported backup file to overwrite current data.
                <span className="text-rose-500 font-black ml-1 border-b border-rose-500/20">WARNING: DESTRUCTIVE ACTION.</span>
              </p>
            </div>

            <div className="rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center space-y-4 hover:border-primary/50 hover:bg-white transition-all relative group/drop">
              {isImporting ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Restoring database sequence...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 group-hover/drop:text-primary group-hover/drop:scale-110 transition-all">
                      <FileJson className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Select Backup Object</p>
                    <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Only .JSON schema accepted</p>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm transition-all hover:translate-y-[-4px]">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3">Privacy Filtering</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
            Backups are exported with broadband customer passwords removed to ensure data security.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm transition-all hover:translate-y-[-4px]">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3">Temporal Snapshot</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
            Backups capture the exact state of your business. We recommend a weekly export protocol.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm transition-all hover:translate-y-[-4px]">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-3">Integrity Verified</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
            Files contain all parameters required for full historical reconstruction and financial audits.
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="rounded-[2rem] border border-rose-200 bg-rose-50/30 p-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
        <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-rose-600 mb-2">Destructive Sequence Protocol</h4>
          <p className="text-[11px] text-rose-500 font-bold uppercase tracking-wider leading-relaxed opacity-80">
            Importing a backup is an irreversible operation. All existing subscribers, invoices, and payments 
            will be purged. Execute only with a verified recovery point.
          </p>
        </div>
      </div>
    </div>
  );
}
