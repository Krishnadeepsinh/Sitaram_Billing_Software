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
      <div className="min-h-screen flex w-full relative bg-slate-950 text-white selection:bg-primary/30 selection:text-white">
        {/* Global Background Pattern */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-slate-900/80 shadow-2xl border border-white/5 scale-100 animate-in zoom-in-95">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Syncing Terminal...</p>
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
    <div className="flex-1 flex flex-col min-w-0 relative">
      <header className="h-16 flex items-center justify-between gap-3 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl px-6 sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-10 w-10 rounded-xl hover:bg-white/5 text-white transition-all active:scale-95"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:block">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-white/5 text-white" />
          </div>
          <div className="relative max-w-md flex-1 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Terminal Search..." 
              className="pl-9 bg-slate-900/50 border-white/5 rounded-xl h-10 text-white placeholder:text-slate-600 focus:ring-primary/20 transition-all border-2 focus:border-primary/50" 
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4">
          <div className="flex items-center rounded-xl border border-white/5 bg-slate-900/50 p-1">
            <button
              type="button"
              onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
              className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeBusinessMode === "cable"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Cable
            </button>
            <button
              type="button"
              onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
              className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeBusinessMode === "broadband"
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              Broadband
            </button>
          </div>
          <div 
            className="h-10 w-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center font-black text-xs text-primary cursor-pointer hover:bg-white/5 transition-all shadow-xl active:scale-95"
            title="Secure Logout"
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

