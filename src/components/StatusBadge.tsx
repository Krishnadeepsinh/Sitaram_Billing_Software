import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  inactive: "bg-muted text-muted-foreground border-border",
  paid: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, onClick, className }: { status: string, onClick?: () => void, className?: string }) {
  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all",
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        styles[status] ?? "bg-secondary text-secondary-foreground border-border",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status === 'expired' ? 'Inactive' : status}
    </span>
  );
}

