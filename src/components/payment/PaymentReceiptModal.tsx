import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFullDate } from "@/lib/mockData";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { logoBase64 } from "@/assets/logoBase64";
import { getBillingPeriodLabel, getInvoiceServiceDates } from "../invoice/invoicePreviewUtils";

type PaymentReceiptModalProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
    upiId: string;
    gstin?: string;
  };
  customerIdLabel: string;
  payment: any;
  subscribers: any[];
  onClose: () => void;
  isCableMode: boolean;
  plans: any[];
  invoices: any[];
  payments: any[];
};

// Moved ReceiptContent OUTSIDE to prevent re-creation on every render
const ReceiptContent = ({ 
  id, 
  payment, 
  subscriber, 
  invoice, 
  brand, 
  isCableMode, 
  customerIdLabel, 
  plans 
}: { 
  id?: string;
  payment: any;
  subscriber: any;
  invoice: any;
  brand: any;
  isCableMode: boolean;
  customerIdLabel: string;
  plans: any[];
}) => {
  const parseAmount = (val: any) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleaned = String(val || '0').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const amount = parseAmount(payment?.amount);
  const discount = parseAmount(payment?.discount);
  const subtotal = amount + discount;

  const numToWords = (n: number) => {
    if (isNaN(n)) return "Zero Rupees Only";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const helper = (num: number): string => {
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? " " + ones[num%10] : "");
      if (num < 1000) return ones[Math.floor(num/100)] + " Hundred" + (num%100 ? " " + helper(num%100) : "");
      if (num < 100000) return helper(Math.floor(num/1000)) + " Thousand" + (num%1000 ? " " + helper(num%1000) : "");
      return helper(Math.floor(num/100000)) + " Lakh" + (num%100000 ? " " + helper(num%100000) : "");
    };
    const result = helper(Math.floor(n));
    return result ? result + " Rupees Only" : "Zero Rupees Only";
  };

  const billingPeriodLabel = getBillingPeriodLabel(invoice, subscriber, plans);
  const serviceDates = getInvoiceServiceDates(invoice, subscriber, plans);
  const servicePeriodLabel = (serviceDates.rechargeDate && serviceDates.expiryDate)
    ? `${formatFullDate(serviceDates.rechargeDate)} to ${formatFullDate(serviceDates.expiryDate)}`
    : billingPeriodLabel;

  const styles: Record<string, React.CSSProperties> = {
    page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: "#1a1a2e", background: "#ffffff", width: 794, minHeight: 1123, margin: "0 auto", boxSizing: "border-box", padding: 0, position: "relative" },
    header: { background: "#1a2e5a", color: "#ffffff", padding: "36px 40px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" },
    headerLeft: { display: "flex", alignItems: "center", gap: 18 },
    logoBox: { width: 76, height: 76, background: "#ffffff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
    companyName: { fontSize: 30, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.1, margin: 0, padding: 0 },
    tagline: { fontSize: 14, color: "#a0b4d0", marginTop: 8, marginBottom: 4, margin: 0, padding: 0 },
    contactInfo: { fontSize: 12, color: "#c8d8ee", marginTop: 10, lineHeight: 1.5 },
    headerBadge: { background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 18px", borderRadius: 6, letterSpacing: 1, textTransform: "uppercase" },
    emeraldBar: { height: 5, background: "linear-gradient(90deg,#16a34a,#34d399)" },
    metaRow: { display: "flex", borderBottom: "1px solid #e4e9f0", background: "#f0fdf4" },
    metaCell: { flex: 1, padding: "14px 20px", borderRight: "1px solid #e4e9f0" },
    metaCellLast: { flex: 1, padding: "14px 20px" },
    metaLabel: { fontSize: 10, color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 },
    metaValue: { fontSize: 14, fontWeight: 700, color: "#1a2e5a", marginTop: 3 },
    statusPaid: { display: "inline-block", background: "#dcfce7", color: "#166534", fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 4, marginTop: 3, border: "1px solid #bbf7d0" },
    amountBanner: { background: "linear-gradient(135deg, #2e7d32 0%, #388e3c 60%, #43a047 100%)", color: "#ffffff", textAlign: "center", padding: "40px 36px" },
    amountLabel: { fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.85, marginBottom: 10 },
    amountValue: { fontSize: 56, fontWeight: 900, letterSpacing: -1, lineHeight: 1 },
    amountWords: { fontSize: 14, opacity: 0.8, marginTop: 10 },
    body: { padding: "22px 36px 28px" },
    twoCol: { display: "flex", gap: 16, marginBottom: 16 },
    infoBox: { flex: 1 },
    sectionTitle: { background: "#1a2e5a", color: "#ffffff", fontSize: 12, fontWeight: 700, padding: "10px 16px", letterSpacing: 0.8, textTransform: "uppercase", borderRadius: "4px 4px 0 0" },
    infoContent: { border: "1px solid #dce4ef", borderTop: "none", padding: "18px 20px", borderRadius: "0 0 4px 4px", background: "#fcfdff" },
    infoRow: { display: "flex", marginBottom: 10, fontSize: 13, lineHeight: 1.4, alignItems: "center" },
    infoKey: { color: "#7a8fa6", fontWeight: 600, width: 100, flexShrink: 0, fontSize: 12 },
    infoVal: { color: "#1a2e5a", fontWeight: 700, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    addressText: { color: "#1a2e5a", fontWeight: 500, lineHeight: 1.6, fontSize: 14 },
    allocBox: { border: "1px solid #dce4ef", borderRadius: 4, overflow: "hidden", marginTop: 0 },
    allocTitle: { background: "#1a2e5a", color: "#ffffff", fontSize: 12, fontWeight: 700, padding: "10px 16px", letterSpacing: 0.8, textTransform: "uppercase" },
    allocRow: { display: "flex", justifyContent: "space-between", padding: "12px 16px", fontSize: 13, borderBottom: "1px solid #eef1f6", color: "#4a5568", lineHeight: 1.2, alignItems: "center" },
    allocRowTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", fontSize: 14, fontWeight: 700, color: "#1a2e5a", borderBottom: "1px solid #eef1f6", background: "#f0f4fa", lineHeight: 1.2 },
    allocRowBalance: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 16px", fontSize: 14, fontWeight: 700, color: "#1b5e20", background: "#e8f5e9", lineHeight: 1.4 },
    verifiedArea: { display: "flex", justifyContent: "center", marginTop: 80, marginBottom: 30 },
    verifiedStamp: { border: "3px solid #2e7d32", borderRadius: "50%", width: 150, height: 150, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#2e7d32", fontWeight: 800, fontSize: 20, letterSpacing: 1, textTransform: "uppercase", position: "relative" },
    checkmark: { fontSize: 56, lineHeight: 1, marginBottom: 2 },
    footer: { background: "#1a2e5a", color: "#a0b4d0", fontSize: 10, textAlign: "center", padding: "10px 20px", marginTop: 20 },
  };

  const LogoImg = () => <img src={logoBase64} width="72" height="72" alt="Logo" style={{ display: "block", objectFit: "contain" }} />;

  const customerInfo = [
    { k: "Full Name", v: subscriber?.name || "N/A" },
    { k: customerIdLabel, v: subscriber?.customerId || subscriber?.id || "N/A" },
    { k: "Mobile No", v: subscriber?.phone || "N/A" },
    { k: "Area", v: subscriber?.area || "N/A" },
    { k: "Service Type", v: isCableMode ? "Digital Cable TV" : "Broadband - Fiber" },
    { k: "Transaction ID", v: payment.id.toUpperCase() },
  ].filter(i => i.v && i.v !== "N/A");

  return (
    <div id={id} style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBox}><LogoImg /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={styles.companyName}>SITARAM CABLE & BROADBAND</div>
            <div style={styles.tagline}>Connecting Every Home</div>
            <div style={styles.contactInfo}>
              ☎ {brand.phone} &nbsp;|&nbsp; ■ {brand.address}
            </div>
          </div>
        </div>
        <div style={styles.headerBadge}>OFFICIAL<br />PAYMENT<br />RECEIPT</div>
      </div>
      <div style={styles.emeraldBar} />

      <div style={styles.metaRow}>
        <div style={styles.metaCell}>
          <div style={styles.metaLabel}>Receipt No</div>
          <div style={styles.metaValue}>REC-{payment.id.slice(-6).toUpperCase()}</div>
        </div>
        <div style={styles.metaCell}>
          <div style={styles.metaLabel}>Payment Date</div>
          <div style={styles.metaValue}>{formatFullDate(payment.date)}</div>
        </div>
        <div style={styles.metaCell}>
          <div style={styles.metaLabel}>Payment Mode</div>
          <div style={styles.metaValue}>{payment.method || "UPI / ONLINE"}</div>
        </div>
        <div style={styles.metaCellLast}>
          <div style={styles.metaLabel}>Status</div>
          <div style={styles.statusPaid}>SUCCESSFUL</div>
        </div>
      </div>

      <div style={styles.amountBanner}>
        <div style={styles.amountLabel}>Amount Received</div>
        <div style={styles.amountValue}>Rs. {amount.toLocaleString("en-IN")}</div>
        <div style={styles.amountWords}>{numToWords(amount)}</div>
      </div>

      <div style={styles.body}>
        <div style={styles.twoCol}>
          <div style={styles.infoBox}>
            <div style={styles.sectionTitle}>Payment Details</div>
            <div style={styles.infoContent}>
              {([
                ["Method", payment.method || "UPI / GPay"],
                ["Paid To", brand.upiId],
                ["Towards", isCableMode ? "Cable TV Subscription" : "Broadband Subscription"],
                ["Service Period", servicePeriodLabel],
                ["Transaction", "CONFIRMED"],
              ] as [string, string][]).map(([k, v]) => (
                <div style={styles.infoRow} key={k}>
                  <span style={styles.infoKey}>{k}:</span>
                  <span style={{
                    ...styles.infoVal,
                    color: k === "Transaction" ? "#1b5e20" : "#1a2e5a",
                    fontWeight: k === "Transaction" ? 800 : 600,
                  }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.infoBox}>
            <div style={styles.sectionTitle}>Customer Details</div>
            <div style={styles.infoContent}>
              {customerInfo.map((item) => (
                <div style={styles.infoRow} key={item.k}>
                  <span style={styles.infoKey}>{item.k}:</span>
                  <span style={styles.infoVal}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.allocBox}>
          <div style={styles.allocTitle}>Payment Allocation Summary</div>
          <div style={styles.allocRow}>
            <span style={{ whiteSpace: "nowrap" }}>Subtotal:</span>
            <span style={{ whiteSpace: "nowrap" }}>Rs. {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={styles.allocRow}>
              <span style={{ whiteSpace: "nowrap", color: "#e8522a", fontWeight: 600 }}>Discount:</span>
              <span style={{ whiteSpace: "nowrap", color: "#e8522a", fontWeight: 600 }}>- Rs. {discount.toFixed(2)}</span>
            </div>
          )}
          <div style={styles.allocRowTotal}>
            <span style={{ whiteSpace: "nowrap" }}>Total Paid:</span>
            <span style={{ whiteSpace: "nowrap" }}>Rs. {amount.toFixed(2)}</span>
          </div>
          <div style={styles.allocRowBalance}>
            <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>Remaining Balance:</span>
            <span style={{ textAlign: "right", marginLeft: 16, whiteSpace: "nowrap" }}>Rs. 0.00 (FULLY CLEARED)</span>
          </div>
        </div>

        <div style={styles.verifiedArea}>
          <div style={styles.verifiedStamp}>
            <span style={styles.checkmark}>✓</span>
            <span>VERIFIED</span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>PAYMENT</span>
            <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, opacity: 0.7 }}>CONFIRMED</span>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        Computer Generated Receipt - No Signature Required &nbsp;|&nbsp; Sitaram Cable &amp; Broadband &nbsp;|&nbsp; {brand.phone}
      </div>
    </div>
  );
};

export default function PaymentReceiptModal({
  brand,
  customerIdLabel,
  payment,
  subscribers,
  onClose,
  isCableMode,
  plans,
  invoices,
  payments,
}: PaymentReceiptModalProps) {
  if (!payment) return null;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(1122);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth - 48;
      const targetWidth = 794;
      const newScale = Math.min(1, Math.max(0.3, containerWidth / targetWidth));
      setScale(newScale);
      setTimeout(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.offsetHeight);
        }
      }, 100);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const subscriber = useMemo(
    () => subscribers.find((item) => item.id === payment.subscriberId),
    [payment.subscriberId, subscribers],
  );

  const invoice = useMemo(
    () => invoices.find((inv) => inv.id === payment.invoiceId),
    [payment.invoiceId, invoices],
  );

  const generatePdfBlob = async () => {
    const element = document.getElementById("receipt-content-print");
    if (!element) throw new Error("Document not ready");

    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      await new Promise(resolve => setTimeout(resolve, 1000));

      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2, 
        backgroundColor: "#ffffff",
        cacheBust: true,
        style: {
          visibility: "visible",
          display: "block",
        }
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      return pdf.output("blob");
    } catch (err) {
      console.error("PDF Gen Error:", err);
      throw err;
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    try {
      const blob = await generatePdfBlob();
      const { saveAs } = await import("file-saver");
      saveAs(blob, `Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`);
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePDF = async () => {
    setIsProcessing(true);
    try {
      const pdfBlob = await generatePdfBlob();
      const fileName = `Receipt_${payment.id.slice(-6).toUpperCase()}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*PAYMENT RECEIPT*\nHello ${subscriber?.name || "Customer"},\nThank you for your payment of *Rs. ${payment.amount}*.\nRef: ${payment.id.slice(-6).toUpperCase()}\nDate: ${formatFullDate(payment.date)}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Receipt ${payment.id.slice(-6).toUpperCase()}`, text: message });
      } else {
        const { saveAs } = await import("file-saver");
        saveAs(pdfBlob, fileName);
        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success("Receipt downloaded & WhatsApp opened");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not share PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative z-10 max-h-[96vh]">
        <div className="px-10 py-6 bg-white flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-[0.2em]">Receipt Preview</span></div>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>
        <div ref={containerRef} className="flex-1 overflow-auto bg-[#EDF1F7] flex justify-center p-12 custom-scrollbar">
          <div ref={contentRef} className="origin-top transition-all" style={{ transform: `scale(${scale})`, marginBottom: `${(scale - 1) * contentHeight}px` }}>
            <ReceiptContent 
              id="receipt-content" 
              payment={payment} 
              subscriber={subscriber} 
              invoice={invoice} 
              brand={brand} 
              isCableMode={isCableMode} 
              customerIdLabel={customerIdLabel}
              plans={plans}
            />
          </div>
        </div>
        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", zIndex: -9999 }}>
          <div id="receipt-content-print">
            <ReceiptContent 
              payment={payment} 
              subscriber={subscriber} 
              invoice={invoice} 
              brand={brand} 
              isCableMode={isCableMode} 
              customerIdLabel={customerIdLabel}
              plans={plans}
            />
          </div>
        </div>
        <div className="p-10 bg-white border-t border-slate-100 flex gap-6 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-16 px-8 text-slate-500 border-slate-200 hover:bg-slate-50 font-bold uppercase tracking-wider text-xs">Discard</Button>
          <div className="flex-1 flex gap-4">
            <Button variant="outline" onClick={handleSharePDF} disabled={isProcessing} className="flex-1 h-16 text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold uppercase tracking-wider text-xs">
              <Send className="mr-2 h-5 w-5" /> WhatsApp / Share
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isProcessing} className="flex-1 h-16 bg-[#1a2e5a] hover:bg-[#15254a] text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-blue-900/20">
              {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />} Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
