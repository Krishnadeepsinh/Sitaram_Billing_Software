import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/context/BillingContext";
import { setActiveBusinessMode, useBusinessMode } from "@/lib/turso";

export default function AppLayout() {
  const { isLoading } = useBilling();
  const activeBusinessMode = useBusinessMode();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Syncing with Turso...</p>
            </div>
          </div>
        )}
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between gap-3 border-b border-border/60 bg-background/70 backdrop-blur-xl px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <SidebarTrigger />
              <div className="relative max-w-md flex-1 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search subscribers, invoices…" className="pl-9 bg-secondary/50 border-border/60" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center rounded-xl border border-border/60 bg-secondary/40 p-0.5 sm:p-1">
                <button
                  type="button"
                  onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
                  className={`h-7 sm:h-8 px-2 sm:px-3 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeBusinessMode === "cable"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cable
                </button>
                <button
                  type="button"
                  onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
                  className={`h-7 sm:h-8 px-2 sm:px-3 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeBusinessMode === "broadband"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Broadband
                </button>
              </div>
              <div 
                className="h-9 w-9 rounded-full bg-gradient-accent flex items-center justify-center font-display font-semibold text-sm text-accent-foreground cursor-pointer hover:opacity-80 transition-all"
                title="Logout"
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
                  localStorage.removeItem("isAuthenticated");
                  window.location.reload();
                }}
              >
                S
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

