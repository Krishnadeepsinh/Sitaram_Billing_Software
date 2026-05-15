import { formatDate } from "@/lib/mockData";

type InvoiceHeaderProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  invoiceLabel: string;
  isReceipt?: boolean;
};

export function InvoiceHeader({ brand, invoiceLabel, isReceipt }: InvoiceHeaderProps) {
  return (
    <div className="w-full relative">
      {/* Top Orange Accent Strip */}
      <div className="h-2 bg-[#F47920] w-full" />
      
      <div className="bg-[#1B2B4B] px-10 py-12 flex justify-between items-center relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F47920] rounded-full -ml-24 -mb-24 blur-3xl" />
        </div>

        {/* Branding Area */}
        <div className="flex gap-8 items-center relative z-10">
          <div className="flex-shrink-0">
             <img 
               src="/sitaram_logo_512x512.png" 
               alt="Sitaram Logo" 
               className="h-24 w-24 object-contain" 
               onError={(e) => {
                 (e.target as HTMLImageElement).src = '/logo-transparent.png';
               }} 
             />
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-white text-3xl font-black tracking-tight leading-none uppercase mb-1">
              SITARAM CABLE & BROADBAND
            </h1>
            <p className="text-[#F47920] text-[11px] font-black tracking-[0.4em] uppercase mb-4">
              Connecting Every Home
            </p>
            <div className="flex flex-col gap-0.5">
               <p className="text-[#94A3B8] text-[9px] font-bold uppercase tracking-wider">
                 {brand.address}
               </p>
               <p className="text-[#94A3B8] text-[9px] font-bold uppercase tracking-wider">
                 Support: {brand.phone}
               </p>
            </div>
          </div>
        </div>

        {/* Document Label */}
        <div className="flex flex-col items-end relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 flex flex-col items-center">
            <p className="text-[#F47920] text-[8px] font-black uppercase tracking-[0.3em] mb-1">OFFICIAL DOCUMENT</p>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none">
              {invoiceLabel}
            </h2>
          </div>
        </div>
      </div>
      
      {/* Divider Strip */}
      <div className="h-[2px] bg-[#F47920]/30 w-full" />
    </div>
  );
}

