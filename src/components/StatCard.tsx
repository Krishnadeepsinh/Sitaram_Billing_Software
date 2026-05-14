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
    <div className="glass-card relative overflow-hidden rounded-2xl p-5 animate-fade-in group hover:border-primary/30 transition-all duration-300">
      <div className={cn("absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-60", ring)} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
          <p className="font-display text-2xl sm:text-3xl font-bold font-mono-num">{value}</p>
          {delta && <p className="text-xs text-muted-foreground">{delta}</p>}
        </div>
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

