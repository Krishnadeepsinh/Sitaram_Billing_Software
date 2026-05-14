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
    <Sidebar collapsible="icon" className="border-r border-white/5">
      <SidebarHeader className="border-b border-white/5 bg-sidebar/80 backdrop-blur-xl">
        <div className="flex flex-col gap-2 px-3 py-4">
          <Logo showText={!collapsed} size="md" />
          {!collapsed && (
            <div className="flex items-center gap-2 mt-2 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 w-fit">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{activeBusinessLabel} ACTIVE</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar/40 backdrop-blur-xl space-y-4 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 px-4 mb-2">Operations Center</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-xl h-11 px-3 hover:bg-white/5 transition-all">
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                        isActive(item.url) ? "bg-primary/20 text-primary shadow-[0_0_15px_-3px_hsl(var(--primary))]" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-[11px] font-black uppercase tracking-widest transition-colors", isActive(item.url) ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute right-0 h-4 w-1 rounded-l-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 px-4 mb-2">Intelligence & Control</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-xl h-11 px-3 hover:bg-white/5 transition-all">
                    <NavLink to={item.url} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                        isActive(item.url) ? "bg-primary/20 text-primary shadow-[0_0_15px_-3px_hsl(var(--primary))]" : "bg-white/5 text-muted-foreground group-hover:text-foreground"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-[11px] font-black uppercase tracking-widest transition-colors", isActive(item.url) ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute right-0 h-4 w-1 rounded-l-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-sidebar-border bg-sidebar-accent/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background/40 border border-sidebar-border/40 backdrop-blur-md shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`h-2 w-2 rounded-full animate-pulse ${hasTursoDB ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">
                {activeBusinessLabel} Node
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground font-bold">
              {hasTursoDB ? 'Securely Synced' : 'Local Persistence'}
            </span>
          </div>
          <div className={`ml-auto h-8 w-8 rounded-lg flex items-center justify-center ${hasTursoDB ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
            <DatabaseZap className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
