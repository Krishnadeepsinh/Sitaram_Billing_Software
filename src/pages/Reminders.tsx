import { formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Calendar, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useBilling } from "@/context/BillingContext";
import { cn } from "@/lib/utils";

const channelStyles: Record<string, string> = {
  WhatsApp: "bg-green-100 text-green-700 border-green-200",
  SMS:      "bg-blue-100 text-blue-600 border-blue-200",
  Email:    "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Reminders() {
  const { reminders, subscribers } = useBilling();
  const sorted = [...reminders].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  const stats = [
    { label: "Sent Today", value: "84", icon: Send, variant: "accent" as const },
    { label: "Queued", value: "12", icon: Clock, variant: "warning" as const },
    { label: "Success Rate", value: "98%", icon: CheckCircle2, variant: "success" as const },
    { label: "Failed", value: "03", icon: XCircle, variant: "destructive" as const },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reminders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Scheduled messages and delivery history.</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm w-full sm:w-auto">
          <Send className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sent Today", value: "84", icon: Send, iconCls: "bg-blue-100 text-blue-600", barCls: "bg-blue-400" },
          { label: "Queued", value: "12", icon: Clock, iconCls: "bg-amber-100 text-amber-600", barCls: "bg-amber-400" },
          { label: "Success Rate", value: "98%", icon: CheckCircle2, iconCls: "bg-green-100 text-green-600", barCls: "bg-green-400" },
          { label: "Failed", value: "03", icon: XCircle, iconCls: "bg-red-100 text-red-600", barCls: "bg-red-400" },
        ].map((s) => (
          <div key={s.label} className="app-card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-none">{s.label}</p>
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", s.iconCls)}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono-num text-foreground leading-none">{s.value}</p>
            </div>
            <div className={cn("h-0.5 w-full rounded-full opacity-60", s.barCls)} />
          </div>
        ))}
      </div>

      {/* Reminders Table */}
      <div className="data-table">
        <div className="border-b border-border bg-secondary/60 px-5 py-3">
          <h2 className="text-base font-semibold text-foreground">Reminder Log</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscriber</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled At</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const sub = subscribers.find(s => s.id === r.subscriberId);
              return (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors group last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{sub?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{r.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      channelStyles[r.channel] ?? "bg-secondary text-muted-foreground border-border"
                    )}>
                      {r.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(r.scheduledAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      r.status === 'sent'    ? "bg-green-100 text-green-700 border-green-200" :
                      r.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" :
                                               "bg-red-100 text-red-600 border-red-200"
                    )}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                      <MessageSquare className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No reminders yet</p>
                    <p className="text-xs text-muted-foreground">Reminders will appear here when created</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="app-card p-5 border-l-2 border-l-blue-400">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" /> Automation Ideas
          </h3>
          <div className="space-y-2">
            {[
              { title: "Due date reminder", subtitle: "3 days before expiry", active: true },
              { title: "After invoice", subtitle: "Right after billing run", active: true },
              { title: "Overdue follow-up", subtitle: "5 days past due", active: false },
            ].map((trigger) => (
              <div key={trigger.title} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{trigger.title}</p>
                  <p className="text-xs text-muted-foreground">{trigger.subtitle}</p>
                </div>
                <div className={cn("h-2 w-2 rounded-full", trigger.active ? "bg-green-500" : "bg-border")} />
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Sample WhatsApp Text</h3>
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              Dear {"{name}"}, your bill of {"{amount}"} for Customer ID {"{Customer ID}"} is due on {"{date}"}. Pay here: {"{link}"}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Default template</span>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-50">Edit</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
