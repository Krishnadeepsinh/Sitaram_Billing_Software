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
    <div className="w-full relative">
      {/* Top Accent Strip */}
      <div className="h-[2.5mm] bg-[#F47920] w-full" />
      
      <div className="bg-[#1B2B4B] px-12 py-10 flex justify-between items-center relative">
        {/* Branding Area */}
        <div className="flex gap-6 items-center">
          <div className="h-18 w-18 bg-white rounded-2xl p-2 flex items-center justify-center">
             <img 
               src="/logo.png" 
               alt="Logo" 
               className="h-14 w-14 object-contain" 
               onError={(e) => {
                 (e.target as HTMLImageElement).src = '/logo.png';
               }}
             />
          </div>
          
          <div className="flex flex-col">
            <p className="text-[#F47920] text-[8px] font-black tracking-[0.4em] uppercase mb-1">
              {brand.name}
            </p>
            <h1 className="text-white text-[24px] font-black tracking-tight leading-none uppercase mb-2">
              {brand.name}
            </h1>
            <p className="text-[#94A3B8] text-[9px] font-bold uppercase tracking-wider">
               {brand.phone} | {brand.address}
            </p>
          </div>
        </div>

        {/* Right Badge Box */}
        <div className="w-[60mm] h-[32mm] bg-[#243352] rounded-[4mm] flex flex-col items-center justify-center border border-white/5 shadow-2xl">
           <p className="text-[#F47920] text-[7px] font-black uppercase tracking-[0.3em] mb-3">DOCUMENT TYPE</p>
           <h2 className="text-[18px] font-black text-white uppercase tracking-widest leading-none mb-3">
             {invoiceLabel}
           </h2>
           <p className="text-[#94A3B8] text-[7px] font-bold uppercase tracking-[0.4em]">Connecting Every Home</p>
        </div>
      </div>
      
      {/* Bottom Accent Strip */}
      <div className="h-[1.2mm] bg-[#F47920] w-full" />
    </div>
  );
}

