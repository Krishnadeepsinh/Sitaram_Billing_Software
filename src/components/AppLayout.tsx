import { Outlet } from "react-router-dom";
import { Menu, Loader2 } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { setActiveBusinessMode, useBusinessMode } from "@/lib/turso";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { isLoading } = useBilling();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground font-sans selection:bg-orange-500/20 selection:text-orange-900">
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl app-card shadow-lg">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
            </div>
          </div>
        )}

        <AppSidebar />
        <AppLayoutContent />
      </div>
    </SidebarProvider>
  );
}

function AppLayoutContent() {
  const { setOpenMobile } = useSidebar();
  const activeBusinessMode = useBusinessMode();

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Top Bar - Mobile Only */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <button
          onClick={() => setOpenMobile(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-foreground text-sm">SITARAM</span>
        <div className="flex gap-2">
          <button
            onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              activeBusinessMode === "cable" ? "bg-orange-500 text-white" : "bg-secondary text-muted-foreground"
            )}
          >
            CABLE
          </button>
          <button
            onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              activeBusinessMode === "broadband" ? "bg-orange-500 text-white" : "bg-secondary text-muted-foreground"
            )}
          >
            BB
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-screen-xl mx-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
