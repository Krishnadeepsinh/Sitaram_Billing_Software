import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  active:   "bg-green-100 text-green-700 border-green-200",
  paid:     "bg-green-100 text-green-700 border-green-200",
  expired:  "bg-red-100 text-red-600 border-red-200",
  overdue:  "bg-red-100 text-red-600 border-red-200",
  pending:  "bg-amber-100 text-amber-700 border-amber-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  sent:     "bg-blue-100 text-blue-600 border-blue-200",
  failed:   "bg-red-100 text-red-600 border-red-200",
};

export function StatusBadge({
  status,
  onClick,
  className,
  isLoading,
}: {
  status: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  isLoading?: boolean;
}) {
  const s = String(status || "").toLowerCase().trim();
  const label = s === "expired" ? "Inactive" : status;

  const badgeClasses = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    onClick && !isLoading && "cursor-pointer hover:opacity-80 transition-opacity",
    isLoading && "opacity-70 cursor-wait",
    statusMap[s] ?? "bg-secondary text-secondary-foreground border-border",
    className
  );

  const content = (
    <>
      {isLoading ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
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
        className={badgeClasses}
      >
        {content}
      </button>
    );
  }

  return <span className={badgeClasses}>{content}</span>;
}
