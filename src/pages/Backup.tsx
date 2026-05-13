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
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <Database className="h-10 w-10 text-primary" />
          Manual Backup & Restore
        </h1>
        <p className="text-muted-foreground font-medium mt-1">Export your database to a local file or import a previously saved backup.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Download className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12" />
          </div>
          
          <div className="relative space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Download className="h-7 w-7 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Manual Backup</h2>
              <p className="text-muted-foreground leading-relaxed">
                Generate a secure JSON snapshot of your entire database. This includes subscribers, invoices, 
                payments, and configuration settings. Keep this file safe as it can be used to restore your system.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Last Export</p>
                <p className="text-sm font-semibold mt-1">Never</p>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Data Points</p>
                <p className="text-sm font-semibold mt-1">{(subscribers.length + payments.length + invoices.length + expenses.length + agents.length).toLocaleString()} items</p>
              </div>
            </div>

            <Button onClick={handleExport} className="w-full h-14 rounded-2xl bg-gradient-primary text-primary-foreground font-bold text-lg hover:shadow-lg hover:shadow-primary/20 transition-all">
              Download Database Backup
            </Button>
          </div>
        </div>

        {/* Import Card */}
        <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Upload className="w-48 h-48 rotate-12 translate-x-12 -translate-y-12" />
          </div>
          
          <div className="relative space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Upload className="h-7 w-7 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Import Backup</h2>
              <p className="text-muted-foreground leading-relaxed">
                Upload a previously exported backup file to overwrite and replace your current system data.
                <span className="text-destructive font-bold ml-1">Warning: All current data will be erased and replaced.</span>
              </p>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-border/60 bg-secondary/10 p-8 text-center space-y-4 hover:border-primary/50 transition-colors relative">
              {isImporting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-medium">Restoring database backup...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <FileJson className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Click to select database backup file</p>
                    <p className="text-xs text-muted-foreground mt-1">Only .json files are supported</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-bold">Sanitized Export</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Backups are exported as structured JSON, and broadband customer passwords are removed from the export by default.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="font-bold">Point-in-Time</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Backups capture the exact state of your business at the moment of export. We recommend exporting weekly for maximum safety.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="font-bold">Audit Ready</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            These files contain all the information required for detailed financial auditing and historical tracking of your broadband network.
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex gap-4">
        <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-destructive">Destructive Action Notice</h4>
          <p className="text-sm text-destructive/80 mt-1">
            Restoring from a backup is a irreversible action. It will delete all current subscribers, invoices, and payments 
            presently in the system. Ensure you have a current backup before performing an import.
          </p>
        </div>
      </div>
    </div>
  );
}

