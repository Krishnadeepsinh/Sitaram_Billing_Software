import { formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Calendar, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useBilling } from "@/context/BillingContext";

export default function Reminders() {
  const { reminders, subscribers } = useBilling();
  const sorted = [...reminders].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 shadow-sm">
            <MessageSquare className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-slate-800">Reminders</h1>
            <p className="text-sm text-slate-500">Scheduled messages and delivery history</p>
          </div>
        </div>
        <Button type="button" className="h-9 rounded-lg border-0 bg-blue-600 px-4 text-xs font-medium text-slate-800 shadow-md shadow-blue-600/25 hover:bg-blue-500">
          <Send className="mr-2 h-3.5 w-3.5" /> New campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: "Sent today", value: "84", icon: Send, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/10" },
          { label: "Queued", value: "12", icon: Clock, color: "text-amber-600", bg: "bg-amber-500/5", border: "border-amber-500/10" },
          { label: "Success rate", value: "98%", icon: CheckCircle2, color: "text-green-600", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
          { label: "Failed", value: "03", icon: XCircle, color: "text-red-500", bg: "bg-rose-500/5", border: "border-rose-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="app-panel group p-4 shadow-inner transition-colors hover:border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${stat.bg} ${stat.border} ${stat.color} transition-transform group-hover:scale-105`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="font-mono text-lg font-semibold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="app-panel overflow-hidden">
        <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2.5 md:grid md:grid-cols-12 md:gap-4">
          <div className="app-table-th col-span-4">Subscriber</div>
          <div className="app-table-th col-span-2">Channel</div>
          <div className="app-table-th col-span-3">Scheduled</div>
          <div className="app-table-th col-span-3 text-right">Status</div>
        </div>
        <div className="divide-y divide-slate-800/50">
          {sorted.map((r) => {
            const sub = subscribers.find(s => s.id === r.subscriberId);
            return (
              <div key={r.id} className="grid grid-cols-12 gap-4 px-4 py-2.5 hover:bg-slate-100/30 transition-colors items-center group">
                <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-600/5 border border-blue-600/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-all">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">{sub?.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500 transition-colors group-hover:text-blue-400">
                      {r.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex col-span-2 items-center">
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-400">
                    {r.channel}
                  </span>
                </div>
                <div className="hidden md:flex col-span-3 items-center gap-1.5 text-[10px] font-mono text-slate-500">
                  <Calendar className="h-3 w-3 text-slate-700" />
                  {formatDate(r.scheduledAt)}
                </div>
                <div className="col-span-12 md:col-span-3 flex justify-between md:justify-end items-center gap-4">
                   <div className="md:hidden flex items-center gap-2 text-[9px] font-mono text-slate-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(r.scheduledAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      r.status === 'sent' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      r.status === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                    }`} />
                    <span className={`text-xs font-medium capitalize ${
                      r.status === 'sent' ? 'text-green-600' : 
                      r.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                    }`}>{r.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="app-panel border-l-4 border-l-blue-500 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-800">Automation ideas</h3>
          </div>
          <div className="space-y-2">
            {[
              { title: "Due date reminder", subtitle: "3 days before expiry", active: true },
              { title: "After invoice", subtitle: "Right after billing run", active: true },
              { title: "Overdue follow-up", subtitle: "5 days past due", active: false }
            ].map((trigger) => (
              <div key={trigger.title} className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-slate-50/40 p-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">{trigger.title}</p>
                  <p className="text-xs text-slate-500">{trigger.subtitle}</p>
                </div>
                <div className={`h-2 w-2 rounded-full ${trigger.active ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="app-panel p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Sample WhatsApp text</h3>
          <div className="space-y-3">
             <div className="rounded-lg border border-slate-200/60 bg-slate-50/40 p-3">
               <p className="font-mono text-xs leading-relaxed text-slate-400 line-clamp-4">
                 Dear {"{name}"}, your bill of {"{amount}"} for Customer ID {"{Customer ID}"} is due on {"{date}"}. Pay here: {"{link}"}
               </p>
               <div className="mt-3 flex items-center justify-between">
                 <span className="text-xs font-medium text-blue-400">Default template</span>
                 <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-medium text-blue-400 hover:bg-blue-50">Edit</Button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


