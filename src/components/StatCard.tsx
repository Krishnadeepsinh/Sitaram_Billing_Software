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
  const variantMap = {
    primary:     { icon: "bg-orange-100 text-orange-600", bar: "bg-orange-400" },
    accent:      { icon: "bg-blue-100 text-blue-600",     bar: "bg-blue-400"   },
    success:     { icon: "bg-green-100 text-green-600",   bar: "bg-green-400"  },
    warning:     { icon: "bg-amber-100 text-amber-600",   bar: "bg-amber-400"  },
    destructive: { icon: "bg-red-100 text-red-600",       bar: "bg-red-400"    },
  };

  return (
    <div className="app-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-none">
          {label}
        </p>
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", variantMap[variant].icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold font-mono-num text-foreground leading-none">{value}</p>
        {delta && <p className="text-xs text-muted-foreground">{delta}</p>}
      </div>
      <div className={cn("h-0.5 w-full rounded-full opacity-60", variantMap[variant].bar)} />
    </div>
  );
}
