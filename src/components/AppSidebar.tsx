import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, Wallet, 
  BarChart3, Receipt, Send, ShieldCheck, 
  DatabaseZap, Database, Sparkles, Activity,
  Cpu, Terminal, Shield, Zap, Globe, Signal,
  ArrowRight, HardDrive, Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasTursoDB, useBusinessMode } from "@/lib/turso";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

const items = [
  { title: "DASHBOARD", url: "/", icon: LayoutDashboard },
  { title: "SUBSCRIBERS", url: "/subscribers", icon: Users },
  { title: "PLANS", url: "/plans", icon: Package },
  { title: "INVOICES", url: "/invoices", icon: FileText },
  { title: "PAYMENTS", url: "/payments", icon: Wallet },
];

const analyticsItems = [
  { title: "REPORTS", url: "/reports", icon: BarChart3 },
  { title: "EXPENSES", url: "/expenses", icon: Receipt },
  { title: "REMINDERS", url: "/reminders", icon: Send },
  { title: "SETTINGS", url: "/settings", icon: ShieldCheck },
  { title: "ARCHIVE", url: "/backup", icon: Database },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const activeBusinessMode = useBusinessMode();
  const activeBusinessLabel = activeBusinessMode === "cable" ? "CABLE" : "BROADBAND";
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-slate-950 text-slate-100 transition-all duration-300">
      <SidebarHeader className="border-b border-white/5 bg-slate-950/40 backdrop-blur-3xl p-0">
        <div className="flex flex-col gap-6 px-6 py-8">
          <Logo showText={!collapsed} size="sm" variant="white" />
          {!collapsed && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-blue-600/5 border border-blue-600/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] group cursor-default transition-all hover:bg-blue-600/10">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full group-hover:bg-blue-500/40 transition-all animate-pulse" />
                <Activity className="h-3.5 w-3.5 text-blue-500 relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 italic leading-none">{activeBusinessLabel}</span>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">NODE_ACTIVE</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent space-y-4 pt-6 overflow-x-hidden no-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-8 mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">Core Registry</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={cn(
                    "rounded-[1.25rem] h-12 px-4 transition-all group relative overflow-hidden",
                    isActive(item.url) ? "bg-blue-600/10 text-white" : "hover:bg-white/5 text-slate-500"
                  )}>
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="flex items-center gap-5">
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500",
                        isActive(item.url) 
                          ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110" 
                          : "bg-slate-900 border border-white/5 text-slate-600 group-hover:text-slate-300 group-hover:bg-slate-800"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] transition-all italic",
                        isActive(item.url) ? "text-white" : "group-hover:text-slate-200"
                      )}>
                        {item.title}
                      </span>
                      {isActive(item.url) && (
                        <div className="absolute right-0 top-3 bottom-3 w-1 rounded-l-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-8 mb-4 mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">Intelligence Hub</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 gap-2">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={cn(
                    "rounded-[1.25rem] h-12 px-4 transition-all group relative overflow-hidden",
                    isActive(item.url) ? "bg-blue-600/10 text-white" : "hover:bg-white/5 text-slate-500"
                  )}>
                    <NavLink to={item.url} onClick={handleLinkClick} className="flex items-center gap-5">
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-500",
                        isActive(item.url) 
                          ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110" 
                          : "bg-slate-900 border border-white/5 text-slate-600 group-hover:text-slate-300 group-hover:bg-slate-800"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] transition-all italic",
                        isActive(item.url) ? "text-white" : "group-hover:text-slate-200"
                      )}>
                        {item.title}
                      </span>
                      {isActive(item.url) && (
                        <div className="absolute right-0 top-3 bottom-3 w-1 rounded-l-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-6 border-t border-white/5 bg-slate-950/60 backdrop-blur-3xl">
        <div className="group relative flex items-center gap-4 px-5 py-4 rounded-[1.75rem] bg-slate-900/60 border border-white/5 hover:border-blue-500/30 transition-all cursor-default shadow-inner overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/[0.02] group-hover:bg-blue-600/[0.05] transition-colors" />
          <div className="flex flex-col min-w-0 relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0 shadow-[0_0_10px]",
                hasTursoDB ? "bg-blue-500 shadow-blue-500/60" : "bg-amber-500 shadow-amber-500/60"
              )} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 truncate italic">
                {activeBusinessLabel}_NODE
              </span>
            </div>
            <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] italic">
              {hasTursoDB ? 'SECURED_CLOUD' : 'LOCAL_RECOVERY'}
            </span>
          </div>
          <div className={cn(
            "ml-auto h-10 w-10 rounded-[1.1rem] flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-2xl relative z-10",
            hasTursoDB 
              ? "bg-blue-600 text-white shadow-blue-600/30" 
              : "bg-amber-500 text-white shadow-amber-500/30"
          )}>
            <DatabaseZap className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
