import { Outlet } from "react-router-dom";
import { Menu, Search, Loader2, LogOut } from "lucide-react";
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
      <div className="min-h-screen flex w-full relative bg-blue-950 text-white selection:bg-primary/25 selection:text-white">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[42%] h-[42%] bg-primary/[0.07] blur-[100px] rounded-full" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[42%] h-[42%] bg-sky-500/[0.06] blur-[100px] rounded-full" />
        </div>

        {isLoading && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/80 backdrop-blur-md transition-all">
            <div className="flex flex-col items-center gap-3 p-7 rounded-xl bg-slate-900/95 border border-slate-800/90 shadow-2xl scale-100 animate-in zoom-in-95">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-xs font-medium text-slate-400">Loading workspace…</p>
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
      <header className="h-14 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 sm:px-5 sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-9 w-9 rounded-lg hover:bg-slate-800/80 text-slate-200 transition-colors active:scale-95"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors" />
          </div>
          <div className="relative max-w-md flex-1 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search subscribers, invoices, areas…" 
              className="pl-10 h-9 rounded-lg border-slate-800/90 bg-slate-900/60 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500/25 focus-visible:border-blue-500/40" 
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-lg border border-slate-800/90 bg-slate-900/50 p-0.5">
            <button
              type="button"
              onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
              className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                activeBusinessMode === "cable"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              Cable
            </button>
            <button
              type="button"
              onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
              className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                activeBusinessMode === "broadband"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-500 hover:text-slate-200"
              }`}
            >
              Broadband
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg border border-slate-800/90 bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800/80"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(() => {});
              localStorage.removeItem("isAuthenticated");
              window.location.reload();
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

