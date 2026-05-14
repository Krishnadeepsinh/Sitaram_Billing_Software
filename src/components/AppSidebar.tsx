import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, Package, FileText, Wallet, 
  BarChart3, Receipt, Send, ShieldCheck, 
  Database, DatabaseZap, ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasTursoDB, useBusinessMode, setActiveBusinessMode } from "@/lib/turso";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Subscribers", url: "/subscribers", icon: Users },
  { title: "Plans", url: "/plans", icon: Package },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Payments", url: "/payments", icon: Wallet },
];

const analyticsItems = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Reminders", url: "/reminders", icon: Send },
  { title: "Settings", url: "/settings", icon: ShieldCheck },
  { title: "Manual Backup", url: "/backup", icon: Database },
];

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const activeBusinessMode = useBusinessMode();
  const { pathname } = useLocation();
  
  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-white/10 bg-slate-950 text-white w-64 hidden md:flex flex-col">
      <SidebarHeader className="border-b border-white/10 bg-slate-950 p-0 shrink-0">
        <div className="flex flex-col gap-4 p-5">
          <Logo showText={true} size="sm" variant="white" />
          <button 
            onClick={() => setActiveBusinessMode(activeBusinessMode === "cable" ? "broadband" : "cable")}
            className="group flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer w-full"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", activeBusinessMode === "cable" ? "bg-amber-500" : "bg-indigo-500")} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                {activeBusinessMode === "cable" ? "CABLE" : "BROADBAND"}
              </span>
            </div>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent space-y-6 pt-5 overflow-y-auto overflow-x-hidden no-scrollbar flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-5 mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            OPERATIONS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={cn(
                    "rounded-lg h-10 px-3 transition-colors group",
                    isActive(item.url) 
                      ? "bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-400 font-medium" 
                      : "hover:bg-slate-900 text-slate-400 hover:text-white"
                  )}>
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-5 mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            ANALYTICS & ADMIN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 gap-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className={cn(
                    "rounded-lg h-10 px-3 transition-colors group",
                    isActive(item.url) 
                      ? "bg-indigo-500/15 border-l-2 border-indigo-500 text-indigo-400 font-medium" 
                      : "hover:bg-slate-900 text-slate-400 hover:text-white"
                  )}>
                    <NavLink to={item.url} onClick={handleLinkClick} className="flex items-center gap-3 w-full">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <div className="mt-auto p-4 border-t border-white/10 bg-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {activeBusinessMode === "cable" ? "CABLE DB" : "BROADBAND DB"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn("w-2 h-2 rounded-full", hasTursoDB ? "bg-emerald-500" : "bg-amber-500")} />
              <span className="text-xs text-slate-400">
                {hasTursoDB ? 'Securely Synced' : 'Local Storage'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
