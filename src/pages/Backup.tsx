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
      activeBusinessMode === 'broadband' ? { ...subscriber, customerPassword: '' } : subscriber
    ));
    const backupData = {
      subscribers: sanitizedSubscribers, payments, invoices, expenses, reminders, agents, plans, companySettings,
      version: '1.0', timestamp: new Date().toISOString(), businessMode: activeBusinessMode, passwordExported: false
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
    toast.success('Backup downloaded successfully');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('WARNING: Importing a backup will OVERWRITE all current data. Are you sure?')) {
      e.target.value = ''; return;
    }
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.subscribers || !data.payments) throw new Error('Invalid backup file format');
        await importBackupData(data);
        toast.success('Backup restored successfully');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to restore backup');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manual Backup</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Export or restore your full workspace as JSON.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="app-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Download className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Export Backup</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Downloads subscribers, invoices, payments, and settings. Customer passwords are not included.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="app-card px-3 py-2.5">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Status</p>
              <p className="text-sm font-semibold font-mono-num text-foreground">Ready</p>
            </div>
            <div className="app-card px-3 py-2.5">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Records</p>
              <p className="text-sm font-semibold font-mono-num text-foreground">
                {(subscribers.length + payments.length + invoices.length + expenses.length).toLocaleString()} items
              </p>
            </div>
          </div>
          <Button onClick={handleExport} className="bg-orange-500 hover:bg-orange-600 text-white w-full">
            <Download className="h-4 w-4 mr-2" /> Download Backup
          </Button>
        </div>

        {/* Import Card */}
        <div className="app-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Upload className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Restore from File</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Replaces all current data with a backup file.{' '}
              <span className="font-medium text-red-500">This cannot be undone.</span>
            </p>
          </div>
          <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-6 text-center space-y-3 hover:border-orange-400/50 hover:bg-secondary/60 transition-all relative">
            {isImporting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Restoring backup…</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <FileJson className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">Drop a JSON backup file here</p>
                <p className="text-xs text-muted-foreground">Accepted format: JSON export from this app</p>
                <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Privacy", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-100", desc: "Passwords are stripped from exports by default." },
          { title: "Timestamped", icon: Clock, color: "text-purple-600", bg: "bg-purple-100", desc: "Each file includes when it was generated." },
          { title: "Validated", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", desc: "Imports are checked before replacing data." },
        ].map((info) => (
          <div key={info.title} className="app-card p-4 flex flex-col gap-3">
            <div className={`h-9 w-9 rounded-lg ${info.bg} flex items-center justify-center`}>
              <info.icon className={`h-4 w-4 ${info.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{info.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="app-card p-5 border-red-200 bg-red-50/50 flex flex-col sm:flex-row gap-4 items-start">
        <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-1">Warning</h4>
          <p className="text-sm text-muted-foreground">
            Importing overwrites subscribers, invoices, payments, and related records. Only proceed with a trusted backup file.
          </p>
        </div>
      </div>
    </div>
  );
}
