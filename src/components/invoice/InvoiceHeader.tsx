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
      <div className="bg-[#162f4f] px-8 py-7 flex justify-between items-center gap-8 text-white">
        <div className="flex gap-5 items-center min-w-0">
          <Logo
            size="xl"
            showText={false}
            iconClassName="h-20 w-20 rounded-2xl p-2 shadow-[0_18px_35px_rgba(0,0,0,0.22)] border-white/30"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">{BRAND_DISPLAY_NAME}</p>
            <h1 className="text-2xl font-black tracking-tight mt-1 leading-tight max-w-[360px]">{brand.name}</h1>
          </div>
        </div>
        <div className="text-right text-sm space-y-2 max-w-[250px] shrink-0">
          <p className="font-black uppercase tracking-[0.14em] text-orange-200">Official Tax Invoice</p>
          <p className="text-xl font-black tracking-tight text-white">{invoiceLabel}</p>
          <p className="whitespace-pre-line leading-relaxed text-blue-50">{brand.address}</p>
          <p className="font-bold">Phone: {brand.phone}</p>
        </div>
      </div>
      <div className="h-2 bg-orange-500" />
    </>
  );
}
