import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────
export interface ReceiptData {
  receiptNo: string;
  dateTime: string;
  invoiceRef: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  payment: {
    method: string;
    upiRef: string;
    paidTo: string;
    towards: string;
    transaction: string;
    channel: string;
  };
  customer: {
    name: string;
    mobile: string;
    customerId: string;
    service: string;
    area: string;
    accountType: string;
  };
  allocation: {
    planCharge: { label: string; amount: number };
    previousDues: number;
    totalPaid: number;
    remainingBalance: number;
  };
  amountReceived: number;
  amountInWords: string;
  upiId: string;
  phones: string[];
  shopAddress: string;
}

// ── Default Data (REC-10543) ───────────────────────────────────────────────
const DEFAULT_DATA: ReceiptData = {
  receiptNo: "REC-10543",
  dateTime: "01 May 2026 | 04:32 PM",
  invoiceRef: "INV-2024-001",
  status: "SUCCESS",
  payment: {
    method: "UPI / GPay",
    upiRef: "UTR123456789012",
    paidTo: "sitaramcable@okicici",
    towards: "Settlement of INV-2024-001",
    transaction: "CONFIRMED",
    channel: "Google Pay",
  },
  customer: {
    name: "Ramesh Kumar Patel",
    mobile: "+91 98001 23456",
    customerId: "SCB-2024-0042",
    service: "Broadband 60 Mbps",
    area: "Zone-B, Veraval",
    accountType: "Postpaid",
  },
  allocation: {
    planCharge: { label: "60 Mbps May 2026", amount: 799.0 },
    previousDues: 200.0,
    totalPaid: 999.0,
    remainingBalance: 0.0,
  },
  amountReceived: 999,
  amountInWords: "Nine Hundred Ninety-Nine Rupees Only",
  upiId: "sitaramcable@okicici",
  phones: ["+91 98765 43210", "+91 91234 56789"],
  shopAddress: "Shop No. 5, Main Market, Veraval, Gujarat - 362265",
};

// ── Styles ─────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    fontSize: 13,
    color: "#1a1a2e",
    background: "#ffffff",
    width: 794,
    minHeight: 1123,
    margin: "0 auto",
    boxSizing: "border-box",
    padding: 0,
  },
  header: {
    background: "#1a2e5a",
    color: "#ffffff",
    padding: "24px 36px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 18 },
  logoBox: {
    width: 76,
    height: 76,
    background: "#ffffff",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  companyName: { fontSize: 22, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2 },
  tagline: { fontSize: 11, color: "#a0b4d0", marginTop: 2 },
  contactInfo: { fontSize: 11, color: "#c8d8ee", marginTop: 8, lineHeight: 1.8 },
  headerBadge: {
    background: "#e8522a",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 16px",
    borderRadius: 6,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    textAlign: "center" as const,
  },
  orangeBar: { height: 5, background: "linear-gradient(90deg,#e8522a,#f4a035)" },

  // Meta row
  metaRow: {
    display: "flex",
    borderBottom: "2px solid #e4e9f0",
    background: "#f8fafc",
  },
  metaCell: { flex: 1, padding: "14px 20px", borderRight: "1px solid #e4e9f0" },
  metaCellLast: { flex: 1, padding: "14px 20px" },
  metaLabel: { fontSize: 10, color: "#7a8fa6", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.6 },
  metaValue: { fontSize: 14, fontWeight: 700, color: "#1a2e5a", marginTop: 3 },
  statusSuccess: {
    display: "inline-block",
    background: "#e8f5e9",
    color: "#1b5e20",
    fontWeight: 800,
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 4,
    marginTop: 3,
    border: "1px solid #a5d6a7",
  },
  statusFailed: {
    display: "inline-block",
    background: "#ffebee",
    color: "#b71c1c",
    fontWeight: 800,
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 4,
    marginTop: 3,
    border: "1px solid #ef9a9a",
  },
  statusPending: {
    display: "inline-block",
    background: "#fff3e0",
    color: "#e65100",
    fontWeight: 800,
    fontSize: 12,
    padding: "3px 10px",
    borderRadius: 4,
    marginTop: 3,
    border: "1px solid #ffcc80",
  },

  // Amount banner
  amountBanner: {
    background: "linear-gradient(135deg, #2e7d32 0%, #388e3c 60%, #43a047 100%)",
    color: "#ffffff",
    textAlign: "center" as const,
    padding: "24px 36px",
  },
  amountLabel: { fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, opacity: 0.85, marginBottom: 6 },
  amountValue: { fontSize: 48, fontWeight: 900, letterSpacing: -1, lineHeight: 1 },
  amountWords: { fontSize: 12, opacity: 0.8, marginTop: 6 },

  // Body
  body: { padding: "22px 36px 28px" },
  twoCol: { display: "flex", gap: 16, marginBottom: 16 },
  infoBox: { flex: 1 },
  sectionTitle: {
    background: "#1a2e5a",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    padding: "7px 14px",
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    borderRadius: "4px 4px 0 0",
  },
  infoContent: {
    border: "1px solid #dce4ef",
    borderTop: "none",
    padding: "12px 14px",
    borderRadius: "0 0 4px 4px",
    background: "#fcfdff",
  },
  infoRow: { display: "flex", marginBottom: 6, fontSize: 12 },
  infoKey: { color: "#7a8fa6", fontWeight: 600, width: 130, flexShrink: 0, fontSize: 11 },
  infoVal: { color: "#1a2e5a", fontWeight: 600 },

  // Allocation table
  allocBox: {
    border: "1px solid #dce4ef",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 0,
  },
  allocTitle: {
    background: "#1a2e5a",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    padding: "8px 14px",
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  allocRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 14px",
    fontSize: 12,
    borderBottom: "1px solid #eef1f6",
    color: "#4a5568",
  },
  allocRowTotal: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#1a2e5a",
    borderBottom: "1px solid #eef1f6",
    background: "#f0f4fa",
  },
  allocRowBalance: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#1b5e20",
    background: "#e8f5e9",
  },

  // Verified stamp area
  verifiedArea: {
    display: "flex",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 4,
  },
  verifiedStamp: {
    border: "3px solid #2e7d32",
    borderRadius: "50%",
    width: 90,
    height: 90,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "#2e7d32",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    position: "relative" as const,
  },
  checkmark: { fontSize: 28, lineHeight: 1, marginBottom: 2 },

  footer: {
    background: "#1a2e5a",
    color: "#a0b4d0",
    fontSize: 10,
    textAlign: "center" as const,
    padding: "10px 20px",
    marginTop: 20,
  },
};

// ── Logo SVG ───────────────────────────────────────────────────────────────
const LogoSVG = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 72, height: 72 }}>
    <rect width="80" height="80" rx="10" fill="#1a2e5a" />
    <circle cx="40" cy="34" r="18" fill="none" stroke="#e8522a" strokeWidth="3" />
    <circle cx="40" cy="34" r="10" fill="none" stroke="#f4a035" strokeWidth="2.5" />
    <circle cx="40" cy="34" r="4" fill="#e8522a" />
    <path d="M28 52 Q40 44 52 52" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M22 58 Q40 48 58 58" stroke="#a0b4d0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <text x="40" y="73" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="700" fontFamily="Arial">SITARAM</text>
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────
interface ReceiptPDFProps {
  data?: Partial<ReceiptData>;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ data }) => {
  const d: ReceiptData = { ...DEFAULT_DATA, ...data };

  const statusStyle =
    d.status === "SUCCESS" ? s.statusSuccess :
    d.status === "FAILED" ? s.statusFailed : s.statusPending;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoBox}><LogoSVG /></div>
          <div>
            <div style={s.companyName}>SITARAM CABLE &amp; BROADBAND</div>
            <div style={s.tagline}>Connecting Every Home</div>
            <div style={s.contactInfo}>
              ☎ {d.phones[0]} &nbsp;|&nbsp; ☎ {d.phones[1]}<br />
              ■ {d.shopAddress}<br />
              WhatsApp Support: {d.phones[0]}<br />
              UPI: {d.upiId}
            </div>
          </div>
        </div>
        <div style={s.headerBadge}>OFFICIAL<br />PAYMENT<br />RECEIPT</div>
      </div>
      <div style={s.orangeBar} />

      {/* Meta Row */}
      <div style={s.metaRow}>
        <div style={s.metaCell}>
          <div style={s.metaLabel}>Receipt No</div>
          <div style={s.metaValue}>{d.receiptNo}</div>
        </div>
        <div style={s.metaCell}>
          <div style={s.metaLabel}>Date &amp; Time</div>
          <div style={s.metaValue}>{d.dateTime}</div>
        </div>
        <div style={s.metaCell}>
          <div style={s.metaLabel}>Invoice Ref</div>
          <div style={s.metaValue}>{d.invoiceRef}</div>
        </div>
        <div style={s.metaCellLast}>
          <div style={s.metaLabel}>Status</div>
          <div style={statusStyle}>{d.status}</div>
        </div>
      </div>

      {/* Amount Banner */}
      <div style={s.amountBanner}>
        <div style={s.amountLabel}>Amount Received</div>
        <div style={s.amountValue}>Rs. {d.amountReceived.toLocaleString("en-IN")}</div>
        <div style={s.amountWords}>{d.amountInWords}</div>
      </div>

      {/* Body */}
      <div style={s.body}>
        {/* Payment + Customer */}
        <div style={s.twoCol}>
          {/* Payment Details */}
          <div style={s.infoBox}>
            <div style={s.sectionTitle}>Payment Details</div>
            <div style={s.infoContent}>
              {([
                ["Method", d.payment.method],
                ["UPI Ref (UTR)", d.payment.upiRef],
                ["Paid To", d.payment.paidTo],
                ["Towards", d.payment.towards],
                ["Transaction", d.payment.transaction],
                ["Channel", d.payment.channel],
              ] as [string, string][]).map(([k, v]) => (
                <div style={s.infoRow} key={k}>
                  <span style={s.infoKey}>{k}:</span>
                  <span style={{
                    ...s.infoVal,
                    color: k === "Transaction" ? "#1b5e20" : "#1a2e5a",
                    fontWeight: k === "Transaction" ? 800 : 600,
                  }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Details */}
          <div style={s.infoBox}>
            <div style={s.sectionTitle}>Customer Details</div>
            <div style={s.infoContent}>
              {([
                ["Name", d.customer.name],
                ["Mobile", d.customer.mobile],
                ["Customer ID", d.customer.customerId],
                ["Service", d.customer.service],
                ["Area", d.customer.area],
                ["Account Type", d.customer.accountType],
              ] as [string, string][]).map(([k, v]) => (
                <div style={s.infoRow} key={k}>
                  <span style={s.infoKey}>{k}:</span>
                  <span style={s.infoVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Allocation */}
        <div style={s.allocBox}>
          <div style={s.allocTitle}>Payment Allocation Summary</div>
          <div style={s.allocRow}>
            <span>Plan Charge ({d.allocation.planCharge.label}):</span>
            <span>Rs. {d.allocation.planCharge.amount.toFixed(2)}</span>
          </div>
          <div style={s.allocRow}>
            <span>Previous Dues Cleared:</span>
            <span>Rs. {d.allocation.previousDues.toFixed(2)}</span>
          </div>
          <div style={s.allocRowTotal}>
            <span>Total Paid:</span>
            <span>Rs. {d.allocation.totalPaid.toFixed(2)}</span>
          </div>
          <div style={s.allocRowBalance}>
            <span>Remaining Balance:</span>
            <span>Rs. {d.allocation.remainingBalance.toFixed(2)}{d.allocation.remainingBalance === 0 ? " (FULLY CLEARED)" : ""}</span>
          </div>
        </div>

        {/* Verified Stamp */}
        <div style={s.verifiedArea}>
          <div style={s.verifiedStamp}>
            <span style={s.checkmark}>✓</span>
            <span>VERIFIED</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>PAYMENT</span>
            <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.5, opacity: 0.7 }}>CONFIRMED</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        Computer Generated Receipt - No Signature Required &nbsp;|&nbsp; Sitaram Cable &amp; Broadband &nbsp;|&nbsp; {d.phones[0]}
      </div>
    </div>
  );
};

export default ReceiptPDF;
