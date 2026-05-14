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
  const accentBar = {
    primary: "bg-blue-500",
    accent: "bg-sky-400",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    destructive: "bg-rose-500",
  }[variant];

  const iconBg = {
    primary: "bg-primary/12 text-primary border-primary/20",
    accent: "bg-accent/12 text-accent border-accent/20",
    success: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/12 text-amber-400 border-amber-500/20",
    destructive: "bg-rose-500/12 text-rose-400 border-rose-500/20",
  }[variant];

  return (
    <div className="app-panel group relative overflow-hidden p-6 transition-colors hover:border-slate-700/90 hover:bg-slate-900/60">
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-35", iconBg.split(" ")[1])} />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <div className="space-y-1">
            <p className="font-display text-3xl font-semibold tracking-tight text-white tabular-nums leading-none sm:text-4xl">
              {value}
            </p>
            {delta && (
              <p className="text-xs font-medium text-slate-500">{delta}</p>
            )}
          </div>
        </div>
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-inner transition-transform duration-300 group-hover:scale-105", iconBg)}>
          <Icon className="h-6 w-6 stroke-[1.75]" />
        </div>
      </div>

      <div className={cn("pointer-events-none absolute bottom-0 left-0 h-0.5 w-full opacity-80", accentBar)} />
    </div>
  );
}

