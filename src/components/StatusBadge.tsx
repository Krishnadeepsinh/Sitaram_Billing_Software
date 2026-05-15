import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

export function StatusBadge({ status, onClick, className, isLoading }: { status: string, onClick?: (e: React.MouseEvent) => void, className?: string, isLoading?: boolean }) {
  const s = String(status || "").toLowerCase().trim();
  
  const badgeStyles = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
    onClick && !isLoading && "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-sm",
    isLoading && "opacity-70 cursor-wait",
    styles[s] ?? "bg-slate-100 text-slate-500 border-slate-200",
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
