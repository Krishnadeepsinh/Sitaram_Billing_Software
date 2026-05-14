import { formatDate } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Calendar, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useBilling } from "@/context/BillingContext";

export default function Reminders() {
  const { reminders, subscribers } = useBilling();
  const sorted = [...reminders].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">COMM_LOG_OPERATIONS</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Automated Notification Infrastructure</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
          <Send className="mr-2 h-3.5 w-3.5" /> EXECUTE_CAMPAIGN
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "SENT_TODAY", value: "84", icon: Send, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/10" },
          { label: "PENDING_EXEC", value: "12", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" },
          { label: "SUCCESS_RATE", value: "98%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
          { label: "FAIL_LOGS", value: "03", icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-3 rounded-xl hover:bg-slate-900/60 transition-all group shadow-inner">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">{stat.label}</p>
                <p className="font-mono text-base font-black text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-slate-800 bg-slate-950/50">
          <div className="col-span-4">SUBSCRIBER_IDENTITY</div>
          <div className="col-span-2">COMMS_CHANNEL</div>
          <div className="col-span-3">SCHEDULED_TIMESTAMP</div>
          <div className="col-span-3 text-right">STATUS_REPORT</div>
        </div>
        <div className="divide-y divide-slate-800/50">
          {sorted.map((r) => {
            const sub = subscribers.find(s => s.id === r.subscriberId);
            return (
              <div key={r.id} className="grid grid-cols-12 gap-4 px-4 py-2.5 hover:bg-slate-800/30 transition-colors items-center group">
                <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-600/5 border border-blue-600/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-all">
                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-100 uppercase tracking-wide truncate">{sub?.name}</p>
                    <p className="text-[7px] font-bold uppercase tracking-[0.25em] text-slate-600 mt-0.5 group-hover:text-blue-500 transition-colors">
                      {r.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex col-span-2 items-center">
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
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
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                      r.status === 'sent' ? 'text-emerald-500' : 
                      r.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                    }`}>{r.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-xl border-l-4 border-l-blue-600 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">SMART_EXECUTION_TRIGGERS</h3>
          </div>
          <div className="space-y-2">
            {[
              { title: "DUE_DATE_REMINDER", subtitle: "T-MINUS 72H EXPIRY", active: true },
              { title: "BILL_GENERATION", subtitle: "IMMEDIATE POST_SYNC", active: true },
              { title: "CHURN_PREVENTION", subtitle: "T-PLUS 120H OVERDUE", active: false }
            ].map((trigger) => (
              <div key={trigger.title} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <div className="text-sm">
                  <p className="text-[10px] font-black text-slate-200 uppercase tracking-wider">{trigger.title}</p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{trigger.subtitle}</p>
                </div>
                <div className={`h-1.5 w-1.5 rounded-full ${trigger.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-xl shadow-xl">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-4">CONTENT_TEMPLATES</h3>
          <div className="space-y-3">
             <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
               <p className="text-[9px] font-mono text-slate-400 line-clamp-3 leading-relaxed">
                 PROTOCOL: Dear {"{name}"}, your broadband bill of {"{amount}"} for Customer ID {"{Customer ID}"} is due on {"{date}"}. Access Terminal: {"{link}"}
               </p>
               <div className="mt-3 flex justify-between items-center">
                 <span className="text-[7px] font-black uppercase tracking-[0.3em] text-blue-500">WHATSAPP_STANDARD_P1</span>
                 <Button variant="ghost" size="sm" className="h-6 px-3 text-[8px] font-black uppercase tracking-widest hover:bg-blue-600/10 text-blue-500">MODIFY</Button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


