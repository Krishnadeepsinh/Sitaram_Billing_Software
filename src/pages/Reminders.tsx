import { formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Calendar, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useBilling } from "@/context/BillingContext";

export default function Reminders() {
  const { reminders, subscribers } = useBilling();
  const sorted = [...reminders].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Automated Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage WhatsApp, SMS and Email notifications</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Send className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Sent Today", value: "84", icon: Send, color: "text-primary" },
          { label: "Pending", value: "12", icon: Clock, color: "text-warning" },
          { label: "Delivered", value: "98%", icon: CheckCircle2, color: "text-success" },
          { label: "Failed", value: "3", icon: XCircle, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="font-mono-num font-bold text-xl">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-secondary/30">
          <div className="col-span-4">Subscriber / Type</div>
          <div className="col-span-2">Channel</div>
          <div className="col-span-3">Scheduled At</div>
          <div className="col-span-3 text-right">Status</div>
        </div>
        <div className="divide-y divide-border/60">
          {sorted.map((r) => {
            const sub = subscribers.find(s => s.id === r.subscriberId);
            return (
              <div key={r.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors items-center">
                <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{sub?.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      {r.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex col-span-2 items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border">
                    {r.channel}
                  </span>
                </div>
                <div className="hidden md:flex col-span-3 items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(r.scheduledAt)}
                </div>
                <div className="col-span-12 md:col-span-3 flex justify-between md:justify-end items-center gap-4">
                   <div className="md:hidden flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(r.scheduledAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      r.status === 'sent' ? 'bg-success' : 
                      r.status === 'pending' ? 'bg-warning' : 'bg-destructive'
                    }`} />
                    <span className="text-xs capitalize font-medium">{r.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h3 className="font-display text-base font-semibold">Smart Triggers</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
              <div className="text-sm">
                <p className="font-medium">Due Date Reminder</p>
                <p className="text-xs text-muted-foreground">3 days before plan expiry</p>
              </div>
              <StatusBadge status="active" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
              <div className="text-sm">
                <p className="font-medium">Bill Generation</p>
                <p className="text-xs text-muted-foreground">Immediate WhatsApp after billing</p>
              </div>
              <StatusBadge status="active" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 opacity-60">
              <div className="text-sm">
                <p className="font-medium">Churn Warning</p>
                <p className="text-xs text-muted-foreground">5 days after expiry without recharge</p>
              </div>
              <StatusBadge status="inactive" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display text-base font-semibold mb-4">Templates</h3>
          <div className="space-y-3">
             <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
               <p className="text-xs font-mono text-muted-foreground line-clamp-3">
                 Dear {"{name}"}, your broadband bill of {"{amount}"} for Customer ID {"{Customer ID}"} is due on {"{date}"}. Pay online via: {"{link}"}
               </p>
               <div className="mt-3 flex justify-between items-center">
                 <span className="text-[10px] uppercase tracking-wider text-primary font-bold">WhatsApp Standard</span>
                 <Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


