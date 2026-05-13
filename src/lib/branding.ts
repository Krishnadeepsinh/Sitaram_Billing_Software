import type { CompanySettings } from "@/lib/mockData";

export const BRAND_NAME = "SITARAM CABLE & BROADBAND";
export const BRAND_DISPLAY_NAME = "Sitaram Cable & Broadband";
export const BRAND_ADDRESS = "Chitra, Bhavnagar 364004";
export const BRAND_PHONE = "9825039825";
export const BRAND_EMAIL = "";
export const BRAND_UPI = "9825039825@ybl";

export const BRAND_GSTIN = "";

export const cleanBrandValue = (value: unknown, fallback: string) => {
  const text = String(value ?? "").trim();
  if (!text || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return fallback;
  }
  return text;
};

export const getBrandSettings = (settings?: Partial<CompanySettings>) => ({
  name: cleanBrandValue(settings?.name, BRAND_NAME),
  address: cleanBrandValue(settings?.address, BRAND_ADDRESS),
  phone: cleanBrandValue(settings?.phone, BRAND_PHONE),
  email: cleanBrandValue(settings?.email, BRAND_EMAIL),
  upiId: cleanBrandValue(settings?.upiId, BRAND_UPI),
  gstin: cleanBrandValue(settings?.gstin, BRAND_GSTIN),
});
