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
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="border-b border-slate-100 bg-white">
        <div className="flex flex-col gap-2 px-3 py-4">
          <Logo showText={!collapsed} size="md" />
          {!collapsed && (
            <div className="flex items-center gap-2 mt-2 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{activeBusinessLabel} ACTIVE</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white space-y-4 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-4 mb-2">Operations Center</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-xl h-11 px-3 hover:bg-slate-50 transition-all border border-transparent active:scale-95">
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        isActive(item.url) ? "bg-slate-900 text-white shadow-md" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-[11px] font-bold uppercase tracking-widest transition-colors", isActive(item.url) ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute right-0 h-4 w-1 rounded-l-full bg-slate-900" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-4 mb-2">Intelligence & Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-xl h-11 px-3 hover:bg-slate-50 transition-all border border-transparent active:scale-95">
                    <NavLink to={item.url} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300",
                        isActive(item.url) ? "bg-slate-900 text-white shadow-md" : "bg-slate-50 text-slate-400 group-hover:text-slate-900"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-[11px] font-bold uppercase tracking-widest transition-colors", isActive(item.url) ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute right-0 h-4 w-1 rounded-l-full bg-slate-900" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`h-2 w-2 rounded-full ${hasTursoDB ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                {activeBusinessLabel} Node
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
              {hasTursoDB ? 'Securely Synced' : 'Local Instance'}
            </span>
          </div>
          <div className={`ml-auto h-8 w-8 rounded-lg flex items-center justify-center ${hasTursoDB ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
            <DatabaseZap className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
