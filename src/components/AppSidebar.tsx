import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, Wallet, 
  Wifi, BarChart3, Receipt, Send, ShieldCheck, 
  DatabaseZap, Database, Zap, Monitor, Activity
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-foreground" },
  { title: "Subscribers", url: "/subscribers", icon: Users, color: "text-sky-400" },
  { title: "Plans", url: "/plans", icon: Package, color: "text-indigo-400" },
  { title: "Invoices", url: "/invoices", icon: FileText, color: "text-blue-400" },
  { title: "Payments", url: "/payments", icon: Wallet, color: "text-amber-400" },
];

const analyticsItems = [
  { title: "Reports", url: "/reports", icon: BarChart3, color: "text-accent" },
  { title: "Expenses", url: "/expenses", icon: Receipt, color: "text-rose-400" },
  { title: "Reminders", url: "/reminders", icon: Send, color: "text-purple-400" },
  { title: "Settings", url: "/settings", icon: ShieldCheck, color: "text-slate-400" },
  { title: "Manual Backup", url: "/backup", icon: Database, color: "text-slate-400" },
];

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const activeBusinessMode = useBusinessMode();
  const activeBusinessLabel = activeBusinessMode === "cable" ? "Cable" : "Broadband";
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-slate-950 text-white selection:bg-white/10">
      <SidebarHeader className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex flex-col gap-2 px-3 py-4">
          <Logo showText={!collapsed} size="sm" variant="white" />
          {!collapsed && (
            <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md bg-blue-600/5 border border-blue-600/10 w-fit">
              <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">{activeBusinessLabel} SECURE NODE</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-950 space-y-4 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 px-6 mb-2">Operations Center</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-lg h-9 px-2.5 hover:bg-white/5 transition-all active:scale-[0.98]">
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center transition-all duration-300",
                        isActive(item.url) ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-900 text-slate-500 group-hover:text-slate-300 border border-slate-800"
                      )}>
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] transition-colors", isActive(item.url) ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute -right-3 h-4 w-1 rounded-l-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 px-6 mb-2">Intelligence & Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-lg h-9 px-2.5 hover:bg-white/5 transition-all active:scale-[0.98]">
                    <NavLink to={item.url} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-7 w-7 rounded-md flex items-center justify-center transition-all duration-300",
                        isActive(item.url) ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-900 text-slate-500 group-hover:text-slate-300 border border-slate-800"
                      )}>
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] transition-colors", isActive(item.url) ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute -right-3 h-4 w-1 rounded-l-full bg-blue-600" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-3 border-t border-slate-800/50 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 shadow-inner">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${hasTursoDB ? 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`} />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                {activeBusinessLabel} Node
              </span>
            </div>
            <span className="text-[7px] text-slate-600 font-bold uppercase tracking-tighter">
              {hasTursoDB ? 'SECURE_SYNC' : 'LOCAL_INSTANCE'}
            </span>
          </div>
          <div className={`ml-auto h-6 w-6 rounded-md flex items-center justify-center ${hasTursoDB ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
            <DatabaseZap className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
