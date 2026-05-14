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
    <>
      <div className="bg-[#162f4f] px-8 py-5 flex justify-between items-center gap-8 text-white">
        <div className="flex gap-4 items-center min-w-0">
          <Logo
            size="lg"
            showText={false}
            iconClassName="h-16 w-16 rounded-xl p-1.5 shadow-lg border-white/20"
          />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-300">{BRAND_DISPLAY_NAME}</p>
            <h1 className="text-2xl font-black tracking-tight mt-1 leading-tight">{brand.name}</h1>
          </div>
        </div>
        <div className="text-right text-xs space-y-1 max-w-[250px] shrink-0">
          <p className="font-black uppercase tracking-[0.14em] text-orange-200">Payment Summary</p>
          <p className="text-lg font-black tracking-tight text-white leading-none mb-2">{invoiceLabel}</p>
          <p className="whitespace-pre-line leading-tight text-blue-50 opacity-90">{brand.address}</p>
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="font-bold text-sm tracking-tight text-orange-50">Support: {brand.phone}</p>
          </div>
        </div>
      </div>
      <div className="h-1.5 bg-orange-500" />
    </>
  );
}
