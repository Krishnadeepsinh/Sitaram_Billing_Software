import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  inactive: "bg-muted text-muted-foreground border-border",
  paid: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, onClick, className, isLoading }: { status: string, onClick?: (e: React.MouseEvent) => void, className?: string, isLoading?: boolean }) {
  const s = String(status || "").toLowerCase().trim();
  
  const badgeStyles = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
    onClick && !isLoading && "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-md",
    isLoading && "opacity-70 cursor-wait",
    styles[s] ?? "bg-secondary text-secondary-foreground border-border",
    className
  );

  const label = (s === 'expired' || s === 'inactive') ? 'Inactive' : (s === 'active' ? 'Active' : status);

  const content = (
    <>
      {isLoading ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {label}
    </>
  );

  if (onClick) {
    return (
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(e);
        }}
        className={badgeStyles}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={badgeStyles}>
      {content}
    </span>
  );
}

