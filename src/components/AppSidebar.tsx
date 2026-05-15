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
  const activeBusinessLabel = activeBusinessMode === "cable" ? "CABLE" : "BROADBAND";
  const { pathname } = useLocation();

  const isActive = (path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navItemClass = (active: boolean) =>
    cn(
      "rounded-r-lg mx-1 h-9 px-3 flex items-center gap-3 text-sm transition-colors w-full",
      active
        ? "bg-orange-500/15 text-orange-400 border-l-2 border-orange-500 rounded-l-none pl-[calc(0.75rem-2px)]"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
    );

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background w-64 hidden md:flex flex-col">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar-background p-0 shrink-0">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3 px-1 py-1">
            <Logo showText={false} size="sm" />
            <div>
              <p className="text-sm font-bold text-white leading-none">SITARAM</p>
              <p className="text-xs text-orange-400 font-medium mt-0.5">Cable & Broadband</p>
            </div>
          </div>
          <button
            onClick={() => setActiveBusinessMode(activeBusinessMode === "cable" ? "broadband" : "cable")}
            className="group flex items-center justify-between px-3 py-2 rounded-lg bg-sidebar-accent border border-sidebar-border hover:border-orange-500/40 hover:bg-orange-500/10 transition-all cursor-pointer w-full"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", activeBusinessMode === "cable" ? "bg-orange-400" : "bg-blue-400")} />
              <span className="text-xs font-bold uppercase tracking-wider text-sidebar-accent-foreground group-hover:text-white transition-colors">
                {activeBusinessMode === "cable" ? "CABLE" : "BROADBAND"}
              </span>
            </div>
            <ArrowRightLeft className="w-3.5 h-3.5 text-sidebar-foreground/50 group-hover:text-orange-400 transition-colors" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar-background space-y-1 pt-3 overflow-y-auto overflow-x-hidden flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 px-4 mb-1 mt-2">
            OPERATIONS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="p-0 h-auto bg-transparent hover:bg-transparent">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      onClick={handleLinkClick}
                      className={navItemClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 px-4 mb-1 mt-4">
            ANALYTICS & ADMIN
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-1">
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} className="p-0 h-auto bg-transparent hover:bg-transparent">
                    <NavLink
                      to={item.url}
                      onClick={handleLinkClick}
                      className={navItemClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* DB Status Footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-sidebar-accent">
          <div className={cn(
            "h-2 w-2 rounded-full flex-shrink-0",
            hasTursoDB ? "bg-green-400 animate-pulse" : "bg-amber-400 animate-pulse"
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-accent-foreground truncate">
              {hasTursoDB ? `${activeBusinessLabel} DB` : "Local Node"}
            </p>
            <p className="text-[9px] text-sidebar-foreground/60">
              {hasTursoDB ? "Securely Synced" : "Offline Mode"}
            </p>
          </div>
          <DatabaseZap className={cn("h-3.5 w-3.5 flex-shrink-0", hasTursoDB ? "text-green-400" : "text-amber-400")} />
        </div>
      </div>
    </Sidebar>
  );
}
