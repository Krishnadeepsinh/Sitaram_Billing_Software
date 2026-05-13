import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Users, Receipt, Wallet, Loader2 } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';

interface ImportStats {
  subscribers: number;
  payments: number;
  invoices: number;
  missingPhone: number;
  missingCustomerId: number;
  source: string;
  importedAt: string;
}

const Import: React.FC = () => {
  const { refreshData } = useBilling();
  const [status, setStatus]       = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [stats, setStats]         = useState<ImportStats | null>(null);
  const [errorMsg, setErrorMsg]   = useState('');

  const handleImport = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/import_data.json');
      if (!res.ok) throw new Error('Could not load import_data.json');
      const data = await res.json();

      // Write directly to localStorage (the app's fallback storage)
      localStorage.setItem('subscribers', JSON.stringify(data.subscribers || []));
      localStorage.setItem('payments',    JSON.stringify(data.payments    || []));
      localStorage.setItem('invoices',    JSON.stringify(data.invoices    || []));
      localStorage.setItem('expenses',    JSON.stringify(data.expenses    || []));
      localStorage.setItem('reminders',   JSON.stringify(data.reminders   || []));
      localStorage.setItem('agents',      JSON.stringify(data.agents      || []));

      setStats(data.stats ? { ...data.stats, source: data.source, importedAt: data.importedAt } : {
        subscribers: data.subscribers?.length ?? 0,
        payments:    data.payments?.length    ?? 0,
        invoices:    data.invoices?.length    ?? 0,
        missingPhone: 0,
        missingCustomerId:   0,
        source:      data.source ?? '',
        importedAt:  data.importedAt ?? '',
      });

      await refreshData();
      setStatus('done');
    } catch (e: any) {
      setErrorMsg(e.message || 'Import failed');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Data Import</h1>
          <p className="text-muted-foreground mt-1">
            Import subscriber billing data from <span className="font-mono text-primary">D:\biju project.xlsx</span>
          </p>
        </div>

        {/* Source info card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" /> Import Source
          </h2>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>📁 File: <span className="text-foreground font-mono">D:\biju project.xlsx</span></p>
            <p>🏢 Network: <span className="text-foreground">SITARAM broadband network</span></p>
            <p>📅 Period: <span className="text-foreground">July – December 2023 (6 months)</span></p>
            <p>📋 Sheets: <span className="text-foreground">BILL-7, BILL-8, BILL-9, BILL-10, BILL-11, BILL-12</span></p>
          </div>
        </div>

        {/* What will be imported */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">What will be imported</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users,   label: 'Subscribers', count: '307', color: 'text-blue-400' },
              { icon: Wallet,  label: 'Payments',    count: '594', color: 'text-green-400' },
              { icon: Receipt, label: 'Invoices',    count: '1,552', color: 'text-purple-400' },
            ].map(({ icon: Icon, label, count, color }) => (
              <div key={label} className="rounded-lg bg-muted/40 p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-1 ${color}`} />
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm text-yellow-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Missing fields in source Excel</p>
            <p>• <strong>Phone numbers</strong> — not recorded in Excel (307 subscribers)</p>
            <p>• <strong>Customer IDs</strong> — not recorded in Excel (307 subscribers)</p>
            <p className="text-yellow-400/70 text-xs">You can fill these in from the Subscribers page after import.</p>
          </div>
        </div>

        {/* Action button */}
        {status === 'idle' && (
          <button
            onClick={handleImport}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Import All Data into App
          </button>
        )}

        {status === 'loading' && (
          <div className="w-full py-4 rounded-xl bg-muted flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Importing data…
          </div>
        )}

        {status === 'done' && stats && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h2 className="font-semibold text-green-300 text-lg">Import Successful!</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">Subscribers</div>
                <div className="text-foreground font-bold text-xl">{stats.subscribers}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">Payments</div>
                <div className="text-foreground font-bold text-xl">{stats.payments}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">Invoices</div>
                <div className="text-foreground font-bold text-xl">{stats.invoices}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-muted-foreground">Missing Fields</div>
                <div className="text-yellow-400 font-bold text-xl">{stats.missingPhone} phone</div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              ✅ Data saved to browser storage. Navigate to <strong>Subscribers</strong> to view and edit the missing phone &amp; Customer IDs.
            </p>
            <a href="/subscribers" className="block text-center py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Go to Subscribers →
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-300">Import Failed</p>
              <p className="text-red-400/80 text-sm mt-1">{errorMsg}</p>
              <p className="text-muted-foreground text-xs mt-2">Make sure you ran: <code>python scripts/import_excel.py</code> first.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Import;


