import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/mockData";

type InvoiceHeaderProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  invoiceLabel: string;
};

export function InvoiceHeader({ brand, invoiceLabel }: InvoiceHeaderProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
      
      {/* Top Accent Strip */}
      <div className="h-1.5 bg-[#F47920] w-full" />
      
      <div className="bg-[#0f172a] px-10 py-10 flex justify-between items-center relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        <div className="flex gap-8 items-center relative z-10">
          <div className="relative">
            <div className="absolute -inset-4 bg-orange-500/10 rounded-full blur-xl" />
            <Logo
              size="xl"
              showText={false}
              iconClassName="h-20 w-20 rounded-2xl p-0.5 shadow-2xl border-2 border-white/10 bg-white"
            />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-px w-6 bg-[#F47920]" />
              <p className="text-[8px] font-black text-orange-400 tracking-[0.3em] uppercase">Premium Network Infrastructure</p>
            </div>
            <h1 className={cn(
              "font-black tracking-tighter text-white leading-none mb-3",
              brand.name.length > 25 ? "text-2xl" : "text-3xl"
            )}>
              {brand.name.toUpperCase()}
            </h1>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <p className="text-[9px] text-slate-400 font-medium leading-relaxed max-w-[280px]">{brand.address}</p>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-[9px] text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="text-orange-500">PH:</span> {brand.phone}
                </p>
                {brand.email && (
                  <p className="text-[9px] text-slate-300 font-bold flex items-center gap-1.5">
                    <span className="text-orange-500">EM:</span> {brand.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Brand Badge / Document Type */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-25" />
          <div className="bg-[#1e293b] border border-white/5 rounded-2xl w-48 py-5 flex flex-col items-center justify-center text-center shadow-2xl relative">
            <p className="text-[7px] font-black text-orange-400 uppercase tracking-[0.4em] mb-2">OFFICIAL RECORD</p>
            <h2 className="text-xl font-black text-white uppercase tracking-wider leading-none mb-3">
              {invoiceLabel.split(' ')[0]}
            </h2>
            <div className="h-0.5 w-10 bg-orange-500/30 mb-3 rounded-full" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>
      
      {/* Visual Separator */}
      <div className="h-px bg-slate-200 w-full" />
    </div>
  );
}
