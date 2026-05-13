import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Phone, MapPin, UserCheck, UserMinus, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useBilling } from "@/context/BillingContext";

export default function Agents() {
  const { agents, payments } = useBilling();
  const [statusF, setStatusF] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return agents.filter(a => statusF === "all" || a.status === statusF);
  }, [statusF, agents]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Users className="h-10 w-10 text-primary" />
            Collection Staff
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage field agents and monitor collection efficiency.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/40">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusF(f)}
                className={`px-5 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-lg transition-all ${
                  statusF === f 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Button className="bg-gradient-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 px-6 font-bold h-11">
            <Plus className="mr-2 h-4 w-4" /> Add Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((agent) => {
          const agentCollections = payments
            .filter((p) => p.agent && agent.name && p.agent === agent.name.split(" ")[0])
            .reduce((sum, p) => sum + p.amount, 0);
          
          return (
            <div key={agent.id} className="glass-card rounded-2xl p-6 hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-display font-bold text-xl ${agent.status === 'active' ? 'bg-gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground border border-border'}`}>
                    {agent.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" /> {agent.phone}
                    </div>
                  </div>
                </div>
                <StatusBadge status={agent.status === "active" ? "active" : "inactive"} />
              </div>

              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Assigned Areas</p>
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.areas.map((area) => (
                      <span key={area} className="text-xs bg-background/50 border border-border px-2 py-0.5 rounded-md">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-success/5 rounded-xl p-3 border border-success/20">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Collected</p>
                    <p className="font-mono-num font-bold text-lg text-success">{formatCurrency(agentCollections)}</p>
                  </div>
                  <div className="bg-accent/5 rounded-xl p-3 border border-accent/20">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Performance</p>
                    <div className="flex items-center gap-1.5 mt-1 text-accent">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-mono-num font-bold">92%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Joined {formatDate(agent.joinDate)}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs">View Report</Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs border-border/60">
                    {agent.status === 'active' ? <UserMinus className="mr-1.5 h-3 w-3" /> : <UserCheck className="mr-1.5 h-3 w-3" />}
                    {agent.status === 'active' ? 'Deactivate' : 'Activate'}
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

