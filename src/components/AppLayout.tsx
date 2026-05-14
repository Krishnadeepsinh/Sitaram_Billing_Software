import { Outlet } from "react-router-dom";
import { Menu, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/context/BillingContext";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { setActiveBusinessMode, useBusinessMode } from "@/lib/turso";

export default function AppLayout() {
  const { isLoading } = useBilling();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative bg-slate-50/50 dark:bg-slate-950/50">
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-background/80 shadow-2xl border border-border/40 scale-100 animate-in zoom-in-95">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-bold tracking-tight text-foreground/80 uppercase">Syncing with Turso...</p>
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
    <div className="flex-1 flex flex-col min-w-0">
      <header className="h-16 flex items-center justify-between gap-3 border-b border-border/60 bg-background/70 backdrop-blur-xl px-4 sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-10 w-10 rounded-xl hover:bg-secondary/80 text-foreground transition-all active:scale-95"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:block">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-secondary/80 text-foreground" />
          </div>
          <div className="relative max-w-md flex-1 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search subscribers, invoices…" className="pl-9 bg-secondary/50 border-border/60 rounded-xl h-10 focus:ring-primary/20 transition-all" />
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
  );
}

