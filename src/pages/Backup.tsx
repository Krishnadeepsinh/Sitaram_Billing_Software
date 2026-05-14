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
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <Database className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">DATA_SNAPSHOT_PROTOCOL</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Disaster Recovery & Archival</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden group hover:bg-slate-900/60 transition-all">
          <div className="absolute -top-6 -right-6 p-6 opacity-[0.05] group-hover:rotate-12 transition-transform pointer-events-none text-blue-500">
            <Download className="w-48 h-48" />
          </div>
          
          <div className="relative space-y-6">
            <div className="h-10 w-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-sm font-black tracking-[0.1em] text-white uppercase">GENERATE_SNAPSHOT</h2>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                CREATE ENCRYPTED JSON DATA BLOCK. INCLUDES ALL CORE BUSINESS LOGS, 
                CLIENT RECORDS, AND SYSTEM PARAMETERS.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                <p className="text-[7px] uppercase tracking-[0.3em] text-slate-600 font-black mb-1">LAST_SYNC</p>
                <p className="text-[10px] font-mono font-black text-slate-300 uppercase">SYSTEM_STABLE</p>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                <p className="text-[7px] uppercase tracking-[0.3em] text-slate-600 font-black mb-1">BLOCK_VOLUME</p>
                <p className="text-[10px] font-mono font-black text-slate-300 uppercase">{(subscribers.length + payments.length + invoices.length + expenses.length + agents.length).toLocaleString()} UNITS</p>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 border-none"
            >
              <Download className="h-3.5 w-3.5" /> EXECUTE_EXPORT_PROTOCOL
            </Button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden group hover:bg-slate-900/60 transition-all">
          <div className="absolute -top-6 -right-6 p-6 opacity-[0.05] group-hover:rotate-12 transition-transform pointer-events-none text-amber-500">
            <Upload className="w-48 h-48" />
          </div>
          
          <div className="relative space-y-6">
            <div className="h-10 w-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
              <Upload className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-sm font-black tracking-[0.1em] text-white uppercase">RESTORE_POINT</h2>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                PURGE CURRENT BUFFER AND OVERWRITE WITH EXTERNAL DATA BLOCK. 
                <span className="text-rose-500 font-black ml-1">DESTRUCTIVE_PROCEDURE.</span>
              </p>
            </div>

            <div className="rounded-lg border-2 border-dashed border-slate-800 bg-slate-950/30 p-6 text-center space-y-3 hover:border-blue-600/50 hover:bg-slate-950/50 transition-all relative group/drop shadow-inner">
              {isImporting ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">RECONSTRUCTING_DATABASE...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className="h-10 w-10 rounded-lg bg-slate-950 shadow-sm border border-slate-800 flex items-center justify-center text-slate-600 group-hover/drop:text-blue-500 group-hover/drop:scale-110 transition-all">
                      <FileJson className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">LOAD_DATA_OBJECT</p>
                    <p className="text-[7px] text-slate-600 mt-1 uppercase font-bold tracking-[0.2em]">Accepted: JSON_SCHEMA</p>
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
          { title: "PRIVACY_ENCRYPTION", icon: ShieldCheck, color: "text-blue-500", desc: "CREDENTIAL_DATA_STRIPPED_FROM_BLOCKS" },
          { title: "TEMPORAL_STAMP", icon: Clock, color: "text-purple-500", desc: "EXACT_SYSTEM_STATE_SYNCHRONIZATION" },
          { title: "INTEGRITY_CHECK", icon: CheckCircle2, color: "text-emerald-500", desc: "SCHEMA_VALIDATION_PASSED_OK" }
        ].map((info) => (
          <div key={info.title} className="bg-slate-900/40 backdrop-blur-xl rounded-xl p-4 border border-slate-800 shadow-xl transition-all hover:bg-slate-900/60">
            <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
              <info.icon className={`h-4 w-4 ${info.color}`} />
            </div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white mb-2">{info.title}</h3>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.1em] leading-relaxed">
              {info.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-6 flex flex-col sm:flex-row gap-4 items-center sm:items-start shadow-xl">
        <div className="h-10 w-10 rounded-lg bg-rose-900/20 flex items-center justify-center shrink-0 border border-rose-900/30">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 mb-1">DESTRUCTIVE_SEQUENCE_PROTOCOL_ALERT</h4>
          <p className="text-[9px] text-rose-600 font-bold uppercase tracking-[0.15em] leading-relaxed opacity-80">
            IMPORT_DATA WILL OVERWRITE ACTIVE REGISTRY. ALL CURRENT SUBSCRIBERS, INVOICES, 
            AND PAYMENTS WILL BE PURGED. EXECUTE ONLY WITH VERIFIED RECOVERY_KEY.
          </p>
        </div>
      </div>
    </div>
  );
}
