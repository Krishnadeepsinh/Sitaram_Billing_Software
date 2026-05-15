import { Logo } from "@/components/Logo";
import { BRAND_DISPLAY_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/mockData";

type InvoiceHeaderProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
  };
  invoiceLabel: string;
};

export function InvoiceHeader({ brand, invoiceLabel }: InvoiceHeaderProps) {
  return (
    <div className="relative">
      {/* Top Accent Bar */}
      <div className="h-[2.5mm] bg-[#F47920] w-full" />
      
      <div className="bg-[#1B2B4B] px-[22mm] py-[8mm] flex justify-between items-center text-white relative h-[48mm]">
        <div className="flex gap-[6mm] items-center">
          <div className="flex flex-col items-center">
            <Logo
              size="lg"
              showText={false}
              iconClassName="h-[14mm] w-[14mm] rounded-none p-0 shadow-none border-none bg-transparent"
            />
            <div className="h-[8mm] w-[0.8mm] bg-[#F47920] mt-2 rounded-full opacity-50" />
          </div>
          
          <div className="flex flex-col">
            <p className="text-[7pt] font-black text-[#F47920] tracking-[0.2em] mb-1">OFFICIAL DOCUMENT</p>
            <h1 className={cn(
              "font-black tracking-tighter text-white leading-none mb-2",
              brand.name.length > 28 ? "text-[14pt]" : brand.name.length > 22 ? "text-[16pt]" : "text-[20pt]"
            )}>
              {brand.name.toUpperCase()}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-[7.5pt] text-[#94A3B8] font-medium">{brand.address}</p>
              <div className="w-1 h-1 rounded-full bg-[#F47920]" />
              <p className="text-[7.5pt] text-[#94A3B8] font-bold">Support: {brand.phone}</p>
            </div>
          </div>
        </div>

        {/* Document Type Box */}
        <div className="bg-[#243352] border border-[#1B2B4B] rounded-[4mm] w-[55mm] h-[32mm] flex flex-col items-center justify-center text-center shadow-2xl">
          <p className="text-[6.5pt] font-black text-[#F47920] uppercase tracking-[0.3em] mb-2 opacity-80">Document Category</p>
          <h2 className="text-[16pt] font-black text-white uppercase tracking-widest leading-none mb-3">
            {invoiceLabel.split(' ')[0]}
          </h2>
          <div className="h-[0.5mm] w-[12mm] bg-white/10 mb-3 rounded-full" />
          <p className="text-[7.5pt] font-bold text-[#94A3B8] uppercase tracking-tighter">
            DATE: {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
      
      {/* Bottom Accent Bar */}
      <div className="h-[1.2mm] bg-[#F47920] w-full" />
    </div>
  );
}
