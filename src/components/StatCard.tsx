import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  variant?: "primary" | "accent" | "success" | "warning" | "destructive";
}

export function StatCard({ label, value, delta, icon: Icon, variant = "primary" }: Props) {
  const colors = {
    primary: "border-primary/50 text-primary shadow-primary/10",
    accent: "border-accent/50 text-accent shadow-accent/10",
    success: "border-emerald-500/50 text-emerald-500 shadow-emerald-500/10",
    warning: "border-amber-500/50 text-amber-500 shadow-amber-500/10",
    destructive: "border-rose-500/50 text-rose-500 shadow-rose-500/10",
  }[variant];

  const iconBg = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    destructive: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  }[variant];

  return (
    <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 animate-fade-in group hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden shadow-2xl shadow-black/40">
      {/* Dynamic Glow Background */}
      <div className={cn("absolute -right-10 -top-10 w-32 h-32 blur-[80px] rounded-full opacity-20 group-hover:opacity-30 transition-opacity", iconBg.split(' ')[1])} />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", iconBg.split(' ')[1])} />
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="font-display text-5xl font-black tracking-tighter text-white tabular-nums leading-none">
              {value}
            </p>
            {delta && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pt-1">{delta}</p>
            )}
          </div>
        </div>
        <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-xl border-2", iconBg)}>
          <Icon className="h-7 w-7 stroke-[2]" />
        </div>
      </div>
      
      {/* Bottom Accent Line */}
      <div className={cn("absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:h-1.5", colors.split(' ')[0], "w-full opacity-30 group-hover:opacity-100 bg-current")} />
    </div>
  );
}

