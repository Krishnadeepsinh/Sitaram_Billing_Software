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
  const ring = {
    primary: "from-primary/30 to-transparent",
    accent: "from-accent/30 to-transparent",
    success: "from-success/30 to-transparent",
    warning: "from-warning/30 to-transparent",
    destructive: "from-destructive/30 to-transparent",
  }[variant];

  const iconBg = {
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/15 text-accent",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  }[variant];

  return (
    <div className="bg-white rounded-[2rem] p-7 border border-slate-200/60 shadow-xl shadow-slate-200/40 animate-fade-in group hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 border-b-4 border-b-primary/10">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", iconBg.split(' ')[1])} />
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">{label}</p>
          </div>
          <div className="space-y-1">
            <p className="font-display text-4xl font-black font-mono-num tracking-tighter text-slate-900">{value}</p>
            {delta && (
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{delta}</p>
            )}
          </div>
        </div>
        <div className={cn("h-14 w-14 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 group-hover:scale-105 shadow-sm border", iconBg)}>
          <Icon className="h-6 w-6 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}

