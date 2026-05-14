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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl scale-100 animate-in zoom-in-95">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-[8px] font-black tracking-[0.3em] text-slate-500 uppercase">SYNCHRONIZING TERMINAL...</p>
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
      <header className="h-12 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-4 sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8 rounded-md hover:bg-white/5 text-white transition-all active:scale-95"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-all" />
          </div>
          <div className="relative max-w-xs flex-1 hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
            <Input 
              placeholder="SEARCH PROTOCOL..." 
              className="pl-8 bg-slate-900/50 border-slate-800 rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-700 focus:ring-blue-600/20 transition-all focus:border-blue-600/50" 
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-4">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/50 p-0.5">
            <button
              type="button"
              onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
              className={`h-7 px-3 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${
                activeBusinessMode === "cable"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-600 hover:text-slate-300"
              }`}
            >
              CABLE
            </button>
            <button
              type="button"
              onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
              className={`h-7 px-3 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${
                activeBusinessMode === "broadband"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-600 hover:text-slate-300"
              }`}
            >
              BROADBAND
            </button>
          </div>
          <div 
            className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-[10px] text-blue-500 cursor-pointer hover:bg-slate-800 transition-all active:scale-95 shadow-inner"
            title="Secure Logout"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
              localStorage.removeItem("isAuthenticated");
              window.location.reload();
            }}
          >
            SYS
          </div>
        </div>
      </header>
      <main className="flex-1 p-3 sm:p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}

