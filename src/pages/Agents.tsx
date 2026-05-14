import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Phone, MapPin, UserCheck, UserMinus, TrendingUp, Users, Shield } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { cn } from "@/lib/utils";

export default function Agents() {
  const { agents, payments } = useBilling();
  const [statusF, setStatusF] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return agents.filter(a => statusF === "all" || a.status === statusF);
  }, [statusF, agents]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* INDUSTRIAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black mb-1 flex items-center gap-2">
            <Shield className="h-3 w-3 text-blue-500" />
            PERSONNEL · FIELD FORCE REGISTRY
          </p>
          <h1 className="font-display text-2xl font-black tracking-tighter text-white uppercase leading-none">
            Network <span className="text-blue-600 italic">Personnel</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800 shadow-inner">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusF(f)}
                className={`px-4 py-1 text-[8px] uppercase font-black tracking-widest rounded-md transition-all ${
                  statusF === f 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-600 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
            <Plus className="mr-2 h-4 w-4" /> Deploy Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const agentCollections = payments
            .filter((p) => p.agent && agent.name && p.agent === agent.name.split(" ")[0])
            .reduce((sum, p) => sum + p.amount, 0);
          
          return (
            <div key={agent.id} className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden group hover:bg-slate-900/60 transition-all">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center font-black text-xs border transition-all shadow-inner",
                    agent.status === 'active' 
                      ? "bg-blue-600/10 text-blue-500 border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white" 
                      : "bg-slate-950 text-slate-700 border-slate-800"
                  )}>
                    {agent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">{agent.name}</h3>
                    <div className="flex items-center gap-2 text-[8px] text-slate-500 font-black uppercase tracking-widest mt-2">
                      <Phone className="h-2.5 w-2.5 text-blue-500/50" /> {agent.phone}
                    </div>
                  </div>
                </div>
                <div className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'bg-slate-800'}`} />
              </div>

              <div className="space-y-4">
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 shadow-inner">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-600">Assigned Operational Clusters</p>
                    <MapPin className="h-2.5 w-2.5 text-blue-600" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.areas.map((area) => (
                      <span key={area} className="text-[7px] font-black uppercase tracking-widest bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md text-slate-400">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-600/5 rounded-xl p-3 border border-blue-600/10 shadow-inner">
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">Gross Collection</p>
                    <p className="font-mono text-xs font-black text-blue-500 mt-1 tabular-nums">{formatCurrency(agentCollections)}</p>
                  </div>
                  <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 shadow-inner">
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">Service Reliability</p>
                    <div className="flex items-center gap-1.5 mt-1 text-blue-400">
                      <TrendingUp className="h-2.5 w-2.5" />
                      <span className="font-mono text-xs font-black">92%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <p className="text-[7px] font-black uppercase tracking-widest text-slate-700">Protocol Start: {formatDate(agent.joinDate)}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/5 text-slate-500 hover:text-white transition-all">Audit</Button>
                  <Button variant="ghost" size="sm" className={cn(
                    "h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                    agent.status === 'active' ? "text-rose-500 hover:bg-rose-500/10" : "text-blue-500 hover:bg-blue-600/10"
                  )}>
                    {agent.status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
