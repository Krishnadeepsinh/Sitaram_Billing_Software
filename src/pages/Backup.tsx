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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_hsl(220_26%_38%/0.12)]">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-slate-800">Backup & restore</h1>
            <p className="text-sm text-slate-500">Export or import your full workspace as JSON</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="bg-white backdrop-blur-xl rounded-xl p-6 border border-slate-200 shadow-xl relative overflow-hidden group hover:bg-slate-50 transition-all">
          <div className="absolute -top-6 -right-6 p-6 opacity-[0.05] group-hover:rotate-12 transition-transform pointer-events-none text-blue-600">
            <Download className="w-48 h-48" />
          </div>
          
          <div className="relative space-y-6">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-slate-800">Export backup</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Downloads subscribers, invoices, payments, and settings. Customer passwords are not included.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/50">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Last export</p>
                <p className="font-mono text-sm font-semibold text-slate-700">Ready</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/50">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Records</p>
                <p className="font-mono text-sm font-semibold text-slate-700">{(subscribers.length + payments.length + invoices.length + expenses.length + agents.length).toLocaleString()} items</p>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-0 bg-blue-600 text-sm font-medium text-slate-800 shadow-md shadow-blue-600/25 transition-colors hover:bg-blue-500 active:scale-[0.99]"
            >
              <Download className="h-4 w-4" /> Download backup
            </Button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white backdrop-blur-xl rounded-xl p-6 border border-slate-200 shadow-xl relative overflow-hidden group hover:bg-slate-50 transition-all">
          <div className="absolute -top-6 -right-6 p-6 opacity-[0.05] group-hover:rotate-12 transition-transform pointer-events-none text-amber-600">
            <Upload className="w-48 h-48" />
          </div>
          
          <div className="relative space-y-6">
            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Upload className="h-5 w-5 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-slate-800">Restore from file</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Replaces all current data with a backup file.
                <span className="ml-1 font-medium text-red-500">This cannot be undone.</span>
              </p>
            </div>

            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/30 p-6 text-center space-y-3 hover:border-blue-600/50 hover:bg-slate-50 transition-all relative group/drop shadow-inner">
              {isImporting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-400">Restoring backup…</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="h-10 w-10 rounded-lg bg-slate-50 shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 group-hover/drop:text-blue-600 group-hover/drop:scale-110 transition-all">
                      <FileJson className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Drop a JSON backup file here</p>
                    <p className="mt-1 text-xs text-slate-500">Accepted format: JSON export from this app</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Privacy", icon: ShieldCheck, color: "text-blue-400", desc: "Passwords are stripped from exports by default." },
          { title: "Timestamped", icon: Clock, color: "text-violet-400", desc: "Each file includes when it was generated." },
          { title: "Validated", icon: CheckCircle2, color: "text-green-600", desc: "Imports are checked before replacing data." }
        ].map((info) => (
          <div key={info.title} className="bg-white backdrop-blur-xl rounded-xl p-4 border border-slate-200 shadow-xl transition-all hover:bg-slate-50">
            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
              <info.icon className={`h-4 w-4 ${info.color}`} />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">{info.title}</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              {info.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 flex flex-col sm:flex-row gap-4 items-center sm:items-start shadow-xl">
        <div className="h-10 w-10 rounded-lg bg-rose-900/20 flex items-center justify-center shrink-0 border border-rose-900/30">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold text-red-500">Warning</h4>
          <p className="text-sm leading-relaxed text-rose-200/90">
            Importing overwrites subscribers, invoices, payments, and related records. Only proceed with a trusted backup file.
          </p>
        </div>
      </div>
    </div>
  );
}
