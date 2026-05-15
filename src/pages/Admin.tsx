import React from 'react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Phone, Smartphone, Database, CheckCircle, Shield, Activity, DatabaseZap, LayoutGrid, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

const Admin: React.FC = () => {
  const { subscribers, hasTursoDB } = useBilling();

  const missingPhone = subscribers.filter(s => !s.phone || s.phone === '');
  const missingCustomerId = subscribers.filter(s => !s.customerId || s.customerId === '');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* INDUSTRIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black mb-1 flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-600" />
            SYSTEM · ADMINISTRATIVE INFRASTRUCTURE
          </p>
          <h1 className="font-display text-2xl font-black tracking-tighter text-slate-800 uppercase leading-none">
            Registry <span className="text-blue-600 italic">Sanitization</span>
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white backdrop-blur-xl p-5 rounded-2xl border border-orange-500/10 shadow-xl group hover:border-orange-500/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-105 transition-transform">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-tight text-slate-800 leading-none">Communication Gaps</h2>
              <p className="text-[8px] font-black text-orange-500/70 uppercase tracking-widest mt-1.5">{missingPhone.length} Objects Require Identity Update</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-6 uppercase tracking-tight">
            These subscribers were imported without valid contact protocols. Resolution required for billing notifications.
          </p>
          <Button variant="outline" className="w-full h-8 border-slate-200 bg-slate-50 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/30 text-[8px] font-black uppercase tracking-widest" asChild>
            <Link to="/subscribers">Access Registry for Fix</Link>
          </Button>
        </div>

        <div className="bg-white backdrop-blur-xl p-5 rounded-2xl border border-blue-500/10 shadow-xl group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200 group-hover:scale-105 transition-transform">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-tight text-slate-800 leading-none">ID Missing Faults</h2>
              <p className="text-[8px] font-black text-blue-600/70 uppercase tracking-widest mt-1.5">{missingCustomerId.length} Critical Metadata Exceptions</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed mb-6 uppercase tracking-tight">
            Customer IDs are mandatory for technical handshake and audit tracing within the core network.
          </p>
          <Button variant="outline" className="w-full h-8 border-slate-200 bg-slate-50 text-blue-600 hover:bg-blue-600/10 hover:border-blue-500/30 text-[8px] font-black uppercase tracking-widest" asChild>
            <Link to="/subscribers">Standardize Metadata</Link>
          </Button>
        </div>
      </div>

      <div className="bg-white backdrop-blur-2xl rounded-2xl p-6 border border-slate-200/50 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-5 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 shadow-inner">
            <DatabaseZap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-slate-800 leading-none">Data Infrastructure Status</h2>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
              <Activity className="h-2 w-2 text-blue-600" />
              Operational Intelligence Record
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/50 group hover:border-blue-600/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20 group-hover:bg-blue-600 group-hover:text-slate-800 transition-all">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">LocalStorage Runtime</p>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1.5">Active Instance: {subscribers.length} Objects Indexed</p>
              </div>
            </div>
            <span className="text-[8px] font-black bg-blue-600/10 text-blue-600 px-3 py-1 rounded-md border border-blue-600/20 uppercase tracking-widest">STABLE</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/50 group hover:border-blue-600/20 transition-all">
            <div className="flex items-center gap-4">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${hasTursoDB ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20 group-hover:bg-blue-600 group-hover:text-slate-800' : 'bg-white text-slate-700 border border-slate-200'}`}>
                <Terminal className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 leading-none">Turso Cloud Integration</p>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1.5">
                  {hasTursoDB ? 'PROTOCOL_SYNC: CONNECTED' : 'PROTOCOL_SYNC: DISCONNECTED (PENDING CONFIG)'}
                </p>
              </div>
            </div>
            <span className={`text-[8px] font-black ${hasTursoDB ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20' : 'bg-white text-slate-700 border border-slate-200'} px-3 py-1 rounded-md uppercase tracking-widest`}>
              {hasTursoDB ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_hsl(220_26%_48%/0.45)]" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Infrastructure Tools</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-9 px-6 bg-blue-600 hover:bg-blue-500 text-slate-800 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all rounded-xl">
              <Link to="/import">Launch Import Suite</Link>
            </Button>
            <Button asChild variant="outline" className="h-9 px-6 border-slate-200 bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-800 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl">
              <Link to="/backup">Archive & Recovery</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
