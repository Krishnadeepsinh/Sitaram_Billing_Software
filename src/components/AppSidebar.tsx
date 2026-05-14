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
  { title: "Invoices", url: "/invoices", icon: FileText, color: "text-emerald-400" },
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
      <SidebarHeader className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex flex-col gap-2 px-3 py-6">
          <Logo showText={!collapsed} size="md" variant="white" />
          {!collapsed && (
            <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-mono">{activeBusinessLabel} SECURE NODE</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-950 space-y-6 pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-6 mb-4">Operations Center</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-2xl h-12 px-3 hover:bg-white/5 transition-all active:scale-[0.98]">
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="relative group flex items-center gap-4">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive(item.url) ? "bg-white text-slate-950 shadow-xl shadow-white/10" : "bg-white/5 text-slate-400 group-hover:text-white"
                      )}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span className={cn("text-[11px] font-black uppercase tracking-[0.15em] transition-colors", isActive(item.url) ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute -right-3 h-6 w-1 rounded-l-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-6 mb-4">Intelligence & Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-2">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-2xl h-12 px-3 hover:bg-white/5 transition-all active:scale-[0.98]">
                    <NavLink to={item.url} onClick={handleLinkClick} className="relative group flex items-center gap-4">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive(item.url) ? "bg-white text-slate-950 shadow-xl shadow-white/10" : "bg-white/5 text-slate-400 group-hover:text-white"
                      )}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span className={cn("text-[11px] font-black uppercase tracking-[0.15em] transition-colors", isActive(item.url) ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute -right-3 h-6 w-1 rounded-l-full bg-white" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-900/50 border border-white/5 shadow-inner">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`h-2 w-2 rounded-full ${hasTursoDB ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {activeBusinessLabel} Node
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
              {hasTursoDB ? 'Securely Synced' : 'Local Instance'}
            </span>
          </div>
          <div className={`ml-auto h-8 w-8 rounded-lg flex items-center justify-center ${hasTursoDB ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
            <DatabaseZap className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
