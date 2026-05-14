import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, Wallet, 
  BarChart3, Receipt, Send, ShieldCheck, 
  DatabaseZap, Database
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
    <Sidebar collapsible="icon" className="border-r border-slate-800/60 bg-slate-950 text-white selection:bg-white/10">
      <SidebarHeader className="border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex flex-col gap-2 px-3 py-4">
          <Logo showText={!collapsed} size="sm" variant="white" />
          {!collapsed && (
            <div className="flex items-center gap-2 mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 w-fit">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.45)]" />
              <span className="text-[11px] font-medium text-slate-400">{activeBusinessLabel} workspace</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-slate-950 space-y-1 pt-3">
        <SidebarGroup>
          <SidebarGroupLabel className="app-eyebrow px-4 mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-lg h-10 px-2 hover:bg-slate-800/60 transition-colors">
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive(item.url) ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "bg-slate-900 text-slate-400 group-hover:text-slate-200 border border-slate-800/80"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-sm font-medium transition-colors", isActive(item.url) ? "text-white" : "text-slate-400 group-hover:text-slate-100")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-blue-500" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="app-eyebrow px-4 mb-1.5 mt-4 text-[10px] uppercase tracking-wider text-slate-500">Reports & tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 gap-0.5">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="rounded-lg h-10 px-2 hover:bg-slate-800/60 transition-colors">
                    <NavLink to={item.url} onClick={handleLinkClick} className="relative group flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive(item.url) ? "bg-blue-600 text-white shadow-md shadow-blue-600/25" : "bg-slate-900 text-slate-400 group-hover:text-slate-200 border border-slate-800/80"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className={cn("text-sm font-medium transition-colors", isActive(item.url) ? "text-white" : "text-slate-400 group-hover:text-slate-100")}>{item.title}</span>
                      {isActive(item.url) && (
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-blue-500" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-3 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`h-2 w-2 rounded-full shrink-0 ${hasTursoDB ? 'bg-blue-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium text-slate-300 truncate">
                {activeBusinessLabel} data
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {hasTursoDB ? 'Cloud sync on' : 'Local only'}
            </span>
          </div>
          <div className={`ml-auto h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${hasTursoDB ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            <DatabaseZap className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
