import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, FileText, Wallet, Wifi, BarChart3, Receipt, Send, ShieldCheck, DatabaseZap, Database } from "lucide-react";
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

import { Logo } from "./Logo";

// ... previous imports ...

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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <Logo showText={!collapsed} size="md" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/"} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics & Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} onClick={handleLinkClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-background/50 border border-sidebar-border/40">
          <div className={`h-2 w-2 rounded-full animate-pulse ${hasTursoDB ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
              {hasTursoDB ? `${activeBusinessLabel} DB` : 'Local Node'}
            </span>
            <span className="text-[9px] text-muted-foreground font-bold">
              {hasTursoDB ? 'Securely Synced' : 'Offline Mode'}
            </span>
          </div>
          <DatabaseZap className={`ml-auto h-3.5 w-3.5 ${hasTursoDB ? 'text-emerald-500' : 'text-amber-500'}`} />
        </div>
      </div>
    </Sidebar>
  );
}

