import { useMemo, useState, useEffect, useRef } from "react";
import { Download, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFullDate } from "@/lib/mockData";
import { toast } from "sonner";
import { getBillingPeriodLabel, getInvoiceLineItem, getInvoiceServiceDates } from "./invoicePreviewUtils";
import { QRCodeSVG } from "qrcode.react";
import { logoBase64 } from "@/assets/logoBase64";

type InvoicePreviewModalProps = {
  brand: {
    name: string;
    address: string;
    phone: string;
    upiId: string;
    gstin?: string;
  };
  customerIdLabel: string;
  invoice: any;
  invoices: any[];
  isCableMode: boolean;
  onClose: () => void;
  payments: any[];
  plans: any[];
  subscribers: any[];
};

export default function InvoicePreviewModal({
  brand,
  customerIdLabel,
  invoice,
  invoices,
  isCableMode,
  onClose,
  payments,
  plans,
  subscribers,
}: InvoicePreviewModalProps) {
  if (!invoice) return null;
  
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
    () => subscribers.find((item) => item.id === invoice.subscriberId),
    [invoice.subscriberId, subscribers],
  );
  const billingPeriodLabel = getBillingPeriodLabel(invoice, subscriber, plans);

  const generatePdfBlob = async () => {
    const element = document.getElementById("invoice-content-print");
    if (!element) throw new Error("Document not ready");

    try {
      const { toPng } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      // Small delay for React to finish rendering DOM and SVG
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
      saveAs(blob, `Invoice_${invoice.number}.pdf`);
      toast.success("Invoice downloaded successfully");
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
      const fileName = `Invoice_${invoice.number}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message = `*INVOICE: ${invoice.number}*\nHello ${subscriber?.name || "Customer"},\nPlease find attached your invoice for *${billingPeriodLabel}*.\nAmount: Rs. ${invoice.amount}\nDue Date: ${formatFullDate(invoice.dueDate)}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${invoice.number}`, text: message });
      } else {
        const { saveAs } = await import("file-saver");
        saveAs(pdfBlob, fileName);
        const cleanPhone = String(subscriber?.phone || "").replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
        toast.success("Bill downloaded & WhatsApp opened");
      }
    } catch (error) {
      console.error(error);
      toast.error("Could not share PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const InvoiceContent = ({ id }: { id?: string }) => {
    const subscriber = useMemo(
      () => subscribers.find((item) => item.id === invoice.subscriberId),
      [invoice.subscriberId, subscribers],
    );

    const parseAmount = (val: any) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const cleaned = String(val || '0').replace(/[^0-9.]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const amount = parseAmount(invoice.amount);
    const previousBalance = parseAmount(invoice.previousBalance);
    const discount = parseAmount(invoice.discount);
    const grandTotal = amount + previousBalance;

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

    const styles: Record<string, React.CSSProperties> = {
      page: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: "#1a1a2e", background: "#ffffff", width: 794, minHeight: 1123, margin: "0 auto", boxSizing: "border-box", padding: 0, position: "relative" },
      header: { background: "#1a2e5a", color: "#ffffff", padding: "36px 40px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" },
      headerLeft: { display: "flex", alignItems: "center", gap: 18 },
      logoBox: { width: 76, height: 76, background: "#ffffff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
      logoSvg: { width: 72, height: 72 },
      companyName: { fontSize: 30, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.1, margin: 0, padding: 0 },
      tagline: { fontSize: 14, color: "#a0b4d0", marginTop: 8, marginBottom: 4, margin: 0, padding: 0 },
      contactInfo: { fontSize: 12, color: "#c8d8ee", marginTop: 10, lineHeight: 1.5 },
      headerBadge: { background: "#e8522a", color: "#fff", fontSize: 13, fontWeight: 700, padding: "6px 18px", borderRadius: 6, letterSpacing: 1, textTransform: "uppercase" },
      orangeBar: { height: 5, background: "linear-gradient(90deg,#e8522a,#f4a035)" },
      metaRow: { display: "flex", borderBottom: "1px solid #e4e9f0", background: "#f8fafc" },
      metaCell: { flex: 1, padding: "14px 20px", borderRight: "1px solid #e4e9f0" },
      metaCellLast: { flex: 1, padding: "14px 20px" },
      metaLabel: { fontSize: 10, color: "#7a8fa6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 },
      metaValue: { fontSize: 14, fontWeight: 700, color: "#1a2e5a", marginTop: 3 },
      statusUnpaid: { display: "inline-block", background: "#fff3e0", color: "#e65100", fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 4, marginTop: 3, border: "1px solid #ffcc80" },
      statusPaid: { display: "inline-block", background: "#e8f5e9", color: "#1b5e20", fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 4, marginTop: 3, border: "1px solid #a5d6a7" },
      body: { padding: "40px 36px 40px" },
      twoCol: { display: "flex", gap: 24, marginBottom: 30 },
      infoBox: { flex: 1 },
      sectionTitle: { background: "#1a2e5a", color: "#ffffff", fontSize: 11, fontWeight: 700, padding: "7px 14px", letterSpacing: 0.8, textTransform: "uppercase", borderRadius: "4px 4px 0 0" },
      infoContent: { border: "1px solid #dce4ef", borderTop: "none", padding: "12px 14px", borderRadius: "0 0 4px 4px", background: "#fcfdff" },
      infoRow: { display: "flex", marginBottom: 6, fontSize: 12 },
      infoKey: { color: "#7a8fa6", fontWeight: 600, width: 130, flexShrink: 0, fontSize: 11 },
      infoVal: { color: "#1a2e5a", fontWeight: 600 },
      addressText: { color: "#1a2e5a", fontWeight: 500, lineHeight: 1.7, fontSize: 12 },
      table: { width: "100%", borderCollapse: "collapse", marginBottom: 0 },
      thRow: { background: "#1a2e5a" },
      th: { color: "#ffffff", fontSize: 11, fontWeight: 700, padding: "9px 12px", textAlign: "left", letterSpacing: 0.5 },
      thRight: { color: "#ffffff", fontSize: 11, fontWeight: 700, padding: "9px 12px", textAlign: "right", letterSpacing: 0.5 },
      td: { padding: "10px 12px", fontSize: 12, color: "#1a2e5a", borderBottom: "1px solid #e4e9f0", textAlign: "left" },
      tdRight: { padding: "10px 12px", fontSize: 12, color: "#1a2e5a", borderBottom: "1px solid #e4e9f0", textAlign: "right" },
      tableWrapper: { border: "1px solid #dce4ef", borderRadius: 4, overflow: "hidden", marginBottom: 30 },
      totalsArea: { display: "flex", justifyContent: "flex-end", marginTop: 0 },
      totalsBox: { width: 340 },
      totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", fontSize: 13, color: "#4a5568", borderBottom: "1px solid #eef1f6", lineHeight: 1.2 },
      grandRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 14px", fontSize: 17, fontWeight: 800, color: "#ffffff", background: "#1a2e5a", borderRadius: "0 0 4px 4px", lineHeight: 1.2 },
      wordsBox: { background: "#f0f4fa", border: "1px solid #dce4ef", borderRadius: 4, padding: "8px 14px", fontSize: 12, color: "#4a5568", fontStyle: "italic", marginTop: 8, marginBottom: 16 },
      bottomArea: { display: "flex", gap: 24, marginTop: 60 },
      payBox: { flex: 1 },
      payTitle: { fontSize: 15, fontWeight: 700, color: "#e8522a", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 16 },
      payItem: { fontSize: 15, color: "#1a2e5a", marginBottom: 12, display: "flex", gap: 10 },
      payNum: { color: "#7a8fa6", fontWeight: 700, width: 26, flexShrink: 0 },
      qrBox: { width: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #dce4ef", borderRadius: 4, padding: "16px 20px", background: "#f8fafc" },
      qrTitle: { fontSize: 12, fontWeight: 700, color: "#1a2e5a", letterSpacing: 0.5, marginBottom: 12 },
      qrUpi: { fontSize: 12, color: "#1a2e5a", fontWeight: 600, marginTop: 8 },
      footer: { background: "#1a2e5a", color: "#a0b4d0", fontSize: 10, textAlign: "center", padding: "10px 20px", marginTop: "auto" },
    };

    const LogoImg = () => <img src={logoBase64} width="72" height="72" alt="Logo" style={{ display: "block", objectFit: "contain" }} />;

    const isPaid = invoice.status === "PAID";
    const statusStyle = isPaid ? styles.statusPaid : styles.statusUnpaid;
    const lineItem = getInvoiceLineItem(invoice, subscriber, plans, isCableMode);
    
    // Service Dates
    const serviceDates = getInvoiceServiceDates(invoice, subscriber, plans);
    const servicePeriodLabel = billingPeriodLabel;

    return (
      <div id={id} style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoBox}><LogoImg /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={styles.companyName}>SITARAM CABLE & BROADBAND</div>
              <div style={styles.tagline}>Connecting Every Home</div>
              <div style={styles.contactInfo}>
                ☎ {brand.phone} &nbsp;|&nbsp; ■ {brand.address}<br />
                WhatsApp Support: {brand.phone} &nbsp;|&nbsp; UPI: {brand.upiId}
              </div>
            </div>
          </div>
          <div style={styles.headerBadge}>INVOICE</div>
        </div>
        <div style={styles.orangeBar} />

        {/* Meta Row */}
        <div style={styles.metaRow}>
          <div style={styles.metaCell}>
            <div style={styles.metaLabel}>Invoice No</div>
            <div style={styles.metaValue}>{invoice.number}</div>
          </div>
          <div style={styles.metaCell}>
            <div style={styles.metaLabel}>Billing Date</div>
            <div style={styles.metaValue}>{formatFullDate(invoice.date)}</div>
          </div>
          <div style={styles.metaCell}>
            <div style={styles.metaLabel}>Due Date</div>
            <div style={styles.metaValue}>{formatFullDate(invoice.dueDate)}</div>
          </div>
          <div style={styles.metaCellLast}>
            <div style={styles.metaLabel}>Status</div>
            <div style={statusStyle}>{isPaid ? "PAID" : "UNPAID"}</div>
          </div>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Customer + Address */}
          <div style={styles.twoCol}>
            <div style={styles.infoBox}>
              <div style={styles.sectionTitle}>Customer Information</div>
              <div style={styles.infoContent}>
                {[
                  { k: "Full Name", v: subscriber?.name },
                  { k: customerIdLabel, v: subscriber?.customerId || subscriber?.id },
                  { k: "Mobile No", v: subscriber?.phone },
                  { k: "Service Type", v: isCableMode ? "Digital Cable TV" : "Broadband - Fiber" },
                  { k: "Device (ONU/MAC)", v: subscriber?.onuSerial || subscriber?.stbNumber },
                ].filter(i => i.v).map((item) => (
                  <div style={styles.infoRow} key={item.k}>
                    <span style={styles.infoKey}>{item.k}:</span>
                    <span style={styles.infoVal}>{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.infoBox}>
              <div style={styles.sectionTitle}>Installation Address</div>
              <div style={styles.infoContent}>
                <div style={styles.addressText}>
                  {subscriber?.address && subscriber.address !== "N/A" ? subscriber.address : ""}
                </div>
                {subscriber?.area && (
                  <div style={{ ...styles.infoRow, marginTop: (subscriber?.address && subscriber.address !== "N/A") ? 10 : 0 }}>
                    <span style={styles.infoKey}>Area:</span>
                    <span style={styles.infoVal}>{subscriber.area}</span>
                  </div>
                )}
                {(!subscriber?.address || subscriber.address === "N/A") && !subscriber?.area && (
                   <div style={styles.addressText}>N/A</div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Plan Name</th>
                  <th style={styles.th}>Service Period</th>
                  <th style={styles.thRight}>Rate (Rs.)</th>
                  <th style={styles.thRight}>Arrears (Rs.)</th>
                  <th style={styles.thRight}>Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#f8fafc" }}>
                  <td style={styles.td}>1</td>
                  <td style={styles.td}>{lineItem.description}</td>
                  <td style={styles.td}>{servicePeriodLabel}</td>
                  <td style={styles.tdRight}>{amount.toFixed(2)}</td>
                  <td style={styles.tdRight}>{previousBalance.toFixed(2)}</td>
                  <td style={styles.tdRight}>{grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={styles.totalsArea}>
            <div style={styles.totalsBox}>
              <div style={{ border: "1px solid #dce4ef", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                <div style={styles.totalRow}>
                  <span style={{ whiteSpace: "nowrap" }}>Plan Amount:</span>
                  <span style={{ whiteSpace: "nowrap" }}>Rs. {(amount + discount).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div style={styles.totalRow}>
                    <span style={{ whiteSpace: "nowrap", color: "#e8522a", fontWeight: 600 }}>Discount:</span>
                    <span style={{ whiteSpace: "nowrap", color: "#e8522a", fontWeight: 600 }}>- Rs. {discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={styles.totalRow}>
                  <span style={{ whiteSpace: "nowrap" }}>Previous Dues (Arrears):</span>
                  <span style={{ whiteSpace: "nowrap" }}>Rs. {previousBalance.toFixed(2)}</span>
                </div>
              </div>
              <div style={styles.grandRow}>
                <span style={{ whiteSpace: "nowrap" }}>GRAND TOTAL:</span>
                <span style={{ whiteSpace: "nowrap" }}>Rs. {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div style={styles.wordsBox}>
            Amount in Words: <strong>{numToWords(grandTotal)}</strong>
          </div>

          {/* Payment Instructions + QR */}
          <div style={styles.bottomArea}>
            <div style={styles.payBox}>
              <div style={styles.payTitle}>Payment Instructions</div>
              {[
                { label: "Pay via UPI", value: brand.upiId },
                { label: "Accepted", value: "GPay / PhonePe / Paytm" },
                { label: "Office Payment", value: "Cash also accepted at office" },
                { label: "Confirmation", value: "Share screenshot after payment" },
                { label: "Support", value: `Call/WhatsApp: ${brand.phone}` },
              ].map((item, i) => (
                <div style={styles.payItem} key={i}>
                  <span style={styles.payNum}>{i + 1}.</span>
                  <div style={{ display: "flex" }}>
                    <span style={{ fontWeight: 600, color: "#7a8fa6", width: 140, flexShrink: 0 }}>{item.label}:</span>
                    <span style={{ fontWeight: 700, flex: 1, whiteSpace: "nowrap" }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.qrBox}>
              <div style={styles.qrTitle}>SCAN & PAY</div>
              <QRCodeSVG value={`upi://pay?pa=${brand.upiId}&pn=SitaramCable&am=${grandTotal}&cu=INR`} size={130} level="H" />
              <div style={styles.qrUpi}>UPI: {brand.upiId}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          Thank you for choosing Sitaram Cable & Broadband &nbsp;|&nbsp; {brand.upiId} &nbsp;|&nbsp; Support: {brand.phone}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col relative z-10 max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 bg-white flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-orange-600 animate-pulse" />
            <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Invoice Preview</span></div>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-slate-100 flex justify-center p-4 sm:p-12 custom-scrollbar">
          <div ref={contentRef} className="origin-top transition-all" style={{ transform: `scale(${scale})`, marginBottom: `${(scale - 1) * contentHeight}px` }}>
            <InvoiceContent id="invoice-content" />
          </div>
        </div>
        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", zIndex: -9999 }}>
          <div id="invoice-content-print">
            <InvoiceContent />
          </div>
        </div>
        <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-12 order-2 sm:order-1 sm:w-32">Close</Button>
          <div className="flex-1 flex gap-3 order-1 sm:order-2">
            <Button variant="outline" onClick={handleSharePDF} disabled={isProcessing} className="flex-1 h-12 text-orange-600 border-orange-200 hover:bg-orange-50 font-bold uppercase tracking-wider text-xs">
              <Send className="mr-2 h-4 w-4" /> WhatsApp / Share
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isProcessing} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-slate-900/20">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
