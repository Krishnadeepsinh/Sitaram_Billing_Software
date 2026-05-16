import { Outlet } from "react-router-dom";
import { Menu, Loader2, DatabaseZap } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { setActiveBusinessMode, useBusinessMode } from "@/lib/turso";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { isLoading } = useBilling();
  const activeBusinessMode = useBusinessMode();

  return (
    <SidebarProvider>
      <div className={cn(
        "flex h-screen w-full bg-background overflow-hidden text-foreground font-sans selection:bg-orange-500/20 selection:text-orange-900",
        activeBusinessMode === "broadband" ? "broadband" : ""
      )}>
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl app-card shadow-lg">
              <Loader2 className={cn("h-8 w-8 animate-spin", activeBusinessMode === "cable" ? "text-orange-500" : "text-blue-500")} />
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
  const { dbError } = useBilling();

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
              "text-[10px] font-bold px-2.5 py-1 rounded-md transition-all shadow-sm",
              activeBusinessMode === "cable" 
                ? "bg-orange-500 text-white shadow-orange-500/20" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            CABLE
          </button>
          <button
            onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-md transition-all shadow-sm",
              activeBusinessMode === "broadband" 
                ? "bg-blue-600 text-white shadow-blue-600/20" 
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            BB
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-background">
        {dbError && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 m-4 md:mx-6 md:mt-6 rounded-r-md shadow-sm">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-orange-800">Operating in Offline Mode</h3>
                <p className="text-xs text-orange-700 mt-1">
                  Could not connect to the database. Displaying cached data. Changes will not be saved to the server.
                  <br/><span className="opacity-75 font-mono mt-1 inline-block">{dbError}</span>
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-screen-xl mx-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
