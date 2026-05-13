import React from "react";
import { cn } from "@/lib/utils";
import { useBusinessMode } from "@/lib/turso";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  showModeLabel?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, iconClassName, showText = true, showModeLabel = showText, size = "md" }: LogoProps) {
  const businessMode = useBusinessMode();
  const modeLabel = businessMode === "cable" ? "Cable Mode" : "Broadband Mode";
  const sizeClasses = {
    sm: { box: "h-8 w-8 rounded-md", image: "rounded-md", text: "text-xs", sub: "text-[8px]", badge: "text-[7px] px-1.5 py-0.5" },
    md: { box: "h-10 w-10 rounded-lg", image: "rounded-lg", text: "text-sm", sub: "text-[10px]", badge: "text-[8px] px-2 py-0.5" },
    lg: { box: "h-14 w-14 rounded-xl", image: "rounded-xl", text: "text-lg", sub: "text-[12px]", badge: "text-[9px] px-2 py-0.5" },
    xl: { box: "h-20 w-20 rounded-2xl", image: "rounded-2xl", text: "text-2xl", sub: "text-[14px]", badge: "text-[10px] px-2.5 py-1" },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/95 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.18)]",
        currentSize.box,
        iconClassName
      )}>
        <img
          src="/logo-mark.png"
          alt="Sitaram Cable & Broadband"
          className={cn("h-full w-full object-contain", currentSize.image)}
        />
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-display font-black tracking-tight text-foreground", currentSize.text)}>
            SITARAM
          </span>
          <span className={cn("font-bold text-muted-foreground uppercase tracking-[0.14em] mt-0.5", currentSize.sub)}>
            Cable & Broadband
          </span>
          {showModeLabel && (
            <span className={cn(
              "mt-1 w-fit rounded-full border border-primary/20 bg-primary/10 font-black uppercase tracking-[0.12em] text-primary",
              currentSize.badge
            )}>
              {modeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

