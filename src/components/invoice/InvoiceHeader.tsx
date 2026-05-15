import { Logo } from "@/components/Logo";
import { BRAND_DISPLAY_NAME } from "@/lib/branding";

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
        <div className="flex gap-4 items-center">
          <Logo
            size="lg"
            showText={false}
            iconClassName="h-[14mm] w-[14mm] rounded-none p-0 shadow-none border-none bg-transparent"
          />
          <div className="space-y-0.5">
            <p className="text-[7.5pt] font-bold text-[#F47920] tracking-wider">SITARAM CABLE & BROADBAND</p>
            <h1 className="text-[18pt] font-bold tracking-tight text-white leading-tight">{brand.name}</h1>
            <p className="text-[7.5pt] text-[#94A3B8] max-w-[400px]">
              {brand.address} | Support: {brand.phone}
            </p>
          </div>
        </div>

        {/* Document Type Box */}
        <div className="bg-[#243352] rounded-[5mm] w-[55mm] h-[32mm] flex flex-col items-center justify-center text-center">
          <p className="text-[7pt] font-bold text-[#F47920] uppercase tracking-widest mb-1">Document Type</p>
          <h2 className="text-[14pt] font-bold text-white uppercase mb-1">{invoiceLabel.split(' ')[0]}</h2>
          <p className="text-[7.5pt] text-[#94A3B8]">Date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>
      
      {/* Bottom Accent Bar */}
      <div className="h-[1.2mm] bg-[#F47920] w-full" />
    </div>
  );
}
