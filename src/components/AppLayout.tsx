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
      <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden text-slate-800 font-sans selection:bg-orange-500/20 selection:text-orange-900">
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-lg">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Loading workspace...</p>
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
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0">
        <button 
          onClick={() => setOpenMobile(true)}
          className="text-slate-500 hover:text-slate-800 transition-colors p-1"
        > 
          <Menu className="w-5 h-5" /> 
        </button>
        <span className="font-bold text-[#1B2B4B] text-sm">SITARAM</span>
        <div className="flex gap-2">
          <button 
            onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              activeBusinessMode === "cable" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            CABLE
          </button>
          <button 
            onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              activeBusinessMode === "broadband" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
            )}
          >
            BB
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F8FAFC]">
        <Outlet />
      </main>
    </div>
  );
}
