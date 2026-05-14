import { Outlet } from "react-router-dom";
import { 
  Menu, Search, Loader2, LogOut, Bell, Settings,
  Shield, Activity, Zap, DatabaseZap, Globe,
  Cpu, Terminal, Command
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/context/BillingContext";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { setActiveBusinessMode, useBusinessMode } from "@/lib/turso";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const { isLoading } = useBilling();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-white font-sans overflow-x-hidden">
        {/* Advanced Industrial Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/[0.07] blur-[160px] rounded-full animate-pulse duration-[10s]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-800/[0.05] blur-[140px] rounded-full animate-pulse duration-[15s]" />
          <div className="absolute top-[30%] right-[15%] w-[40%] h-[40%] bg-blue-900/[0.03] blur-[120px] rounded-full" />
          
          {/* Cyber Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl transition-all duration-700">
            <div className="flex flex-col items-center gap-6 p-12 rounded-[3rem] bg-slate-900/40 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="h-20 w-20 rounded-3xl bg-slate-950 border border-white/5 flex items-center justify-center shadow-inner relative z-10">
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-black tracking-[0.5em] text-blue-500 uppercase italic">Initializing_Protocols</p>
                <p className="text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase">Synchronizing High-Frequency Ledger Data</p>
              </div>
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
    <div className="flex-1 flex flex-col min-w-0 relative z-10">
      <header className="h-20 flex items-center justify-between gap-8 border-b border-white/5 bg-slate-950/40 backdrop-blur-3xl px-8 sm:px-10 sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-12 w-12 rounded-2xl hover:bg-white/5 text-slate-400 transition-all active:scale-95 border border-white/5 shadow-inner"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <SidebarTrigger className="h-12 w-12 rounded-2xl bg-slate-900/40 border border-white/5 text-slate-500 hover:text-white hover:bg-slate-800 transition-all shadow-inner active:scale-95" />
          </div>
          <div className="relative max-w-md flex-1 hidden lg:block group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <Search className="h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <Input 
              placeholder="QUICK_ACCESS_COMMANDS" 
              className="pl-12 pr-12 h-12 rounded-2xl border border-white/5 bg-slate-950/40 text-[11px] font-black tracking-widest text-white placeholder:text-slate-700 focus-visible:ring-blue-500/10 focus-visible:border-blue-500/30 transition-all uppercase italic shadow-inner" 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-900 border border-white/10 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
              <Command className="h-3 w-3 text-slate-500" />
              <span className="text-[9px] font-black text-slate-500 tracking-tighter">K</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center rounded-2xl border border-white/5 bg-slate-950/60 p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
            <button
              type="button"
              onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
              className={cn(
                "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic",
                activeBusinessMode === "cable"
                  ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)] border border-blue-400/20"
                  : "text-slate-600 hover:text-slate-300"
              )}
            >
              CABLE
            </button>
            <button
              type="button"
              onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
              className={cn(
                "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic",
                activeBusinessMode === "broadband"
                  ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)] border border-blue-400/20"
                  : "text-slate-600 hover:text-slate-300"
              )}
            >
              BROADBAND
            </button>
          </div>

          <div className="h-10 w-[1px] bg-white/5 mx-2 hidden sm:block" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 bg-slate-900/20 border border-white/5 hidden sm:flex transition-all active:scale-95">
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 bg-slate-900/20 border border-white/5 transition-all active:scale-95 shadow-sm"
              title="SECURITY_TERMINATE"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
                localStorage.removeItem("isAuthenticated");
                window.location.reload();
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-[2000px] mx-auto p-6 sm:p-10 lg:p-12 relative">
        <Outlet />
      </main>
    </div>
  );
}
