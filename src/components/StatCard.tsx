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
  const borderColor = {
    primary: "border-l-orange-500",
    accent: "border-l-blue-500",
    success: "border-l-green-500",
    warning: "border-l-amber-500",
    destructive: "border-l-red-500",
  }[variant];

  const iconStyles = {
    primary: "bg-orange-50 text-orange-500",
    accent: "bg-blue-50 text-blue-500",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    destructive: "bg-red-50 text-red-500",
  }[variant];

  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-100 shadow-sm p-5 transition-shadow hover:shadow-md border-l-4",
      borderColor
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <div className="space-y-1">
            <p className="font-mono text-2xl font-bold tracking-tight text-slate-800 tabular-nums leading-none">
              {value}
            </p>
            {delta && (
              <p className="text-xs text-slate-500">{delta}</p>
            )}
          </div>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconStyles)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
