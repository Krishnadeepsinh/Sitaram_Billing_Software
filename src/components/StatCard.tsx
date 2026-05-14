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
    <div className="glass-card relative overflow-hidden rounded-[2.5rem] p-6 animate-fade-in group hover:-translate-y-1 transition-all duration-500">
      <div className={cn("absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40", ring)} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black opacity-60">{label}</p>
          <div className="space-y-1">
            <p className="font-display text-3xl sm:text-4xl font-black font-mono-num tracking-tighter text-glow-primary">{value}</p>
            {delta && (
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{delta}</p>
              </div>
            )}
          </div>
        </div>
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg border border-white/5", iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

