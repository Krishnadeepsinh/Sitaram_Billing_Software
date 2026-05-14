import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, Wallet, 
  Wifi, BarChart3, Receipt, Send, ShieldCheck, 
  DatabaseZap, Database, Zap, Monitor, Activity
} from "lucide-react";
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-2 py-3">
          <Logo showText={!collapsed} size="md" />
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar/30 backdrop-blur-sm">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="relative group">
                      <item.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive(item.url) ? 'text-primary' : item.color}`} />
                      <span className="font-medium tracking-tight">{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute right-2 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Analytics & Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} onClick={handleLinkClick} className="relative group">
                      <item.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive(item.url) ? 'text-primary' : item.color}`} />
                      <span className="font-medium tracking-tight">{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute right-2 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
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
