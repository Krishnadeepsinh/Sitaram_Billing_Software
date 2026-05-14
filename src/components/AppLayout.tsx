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
      <div className="flex h-screen w-full bg-[#0A0A0F] overflow-hidden text-[#F1F1F5] font-sans selection:bg-[#6C63FF]/30 selection:text-white">
        {isLoading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-[#111118] border border-[#2A2A3A] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              <Loader2 className="h-8 w-8 text-[#6C63FF] animate-spin" />
              <p className="text-sm font-medium text-[#9090A8]">Loading workspace...</p>
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
      <div className="flex md:hidden items-center justify-between px-4 py-3 bg-[#111118] border-b border-[#2A2A3A] shrink-0">
        <button 
          onClick={() => setOpenMobile(true)}
          className="text-[#9090A8] hover:text-[#F1F1F5] transition-colors p-1"
        > 
          <Menu className="w-5 h-5" /> 
        </button>
        <span className="font-bold text-[#F1F1F5] text-sm">SITARAM</span>
        <div className="flex gap-2">
          <button 
            onClick={() => activeBusinessMode !== "cable" && setActiveBusinessMode("cable")}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              activeBusinessMode === "cable" ? "bg-[#6C63FF] text-white" : "bg-[#1A1A24] text-[#9090A8]"
            )}
          >
            CABLE
          </button>
          <button 
            onClick={() => activeBusinessMode !== "broadband" && setActiveBusinessMode("broadband")}
            className={cn(
              "text-xs px-2 py-1 rounded transition-colors",
              activeBusinessMode === "broadband" ? "bg-[#6C63FF] text-white" : "bg-[#1A1A24] text-[#9090A8]"
            )}
          >
            BB
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
