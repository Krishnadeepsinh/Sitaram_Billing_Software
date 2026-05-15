import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────
export interface InvoiceLineItem {
  id: number;
  planName: string;
  servicePeriod: string;
  duration: string;
  rate: number;
  arrears: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNo: string;
  billingDate: string;
  dueDate: string;
  status: "UNPAID" | "PAID" | "OVERDUE";
  customer: {
    fullName: string;
    customerId: string;
    mobile: string;
    serviceType: string;
    deviceONU: string;
  };
  address: {
    line1: string;
    line2: string;
    line3: string;
    area: string;
    tower: string;
  };
  lineItems: InvoiceLineItem[];
  planAmount: number;
  previousDues: number;
  grandTotal: number;
  amountInWords: string;
  upiId: string;
  phones: string[];
  shopAddress: string;
}

// ── Default Data (INV-2024-001) ────────────────────────────────────────────
const DEFAULT_DATA: InvoiceData = {
  invoiceNo: "INV-2024-001",
  billingDate: "01 May 2026",
  dueDate: "10 May 2026",
  status: "UNPAID",
  customer: {
    fullName: "Ramesh Kumar Patel",
    customerId: "SCB-2024-0042",
    mobile: "+91 98001 23456",
    serviceType: "Broadband - Fiber",
    deviceONU: "SNB-4F:2A:91:BC:D0:11",
  },
  address: {
    line1: "House No. 12, Patel Colony,",
    line2: "Near Ram Mandir, Station Road,",
    line3: "Veraval, Gujarat - 362265",
    area: "Zone-B",
    tower: "VRW-02",
  },
  lineItems: [
    {
      id: 1,
      planName: "60 Mbps Unlimited",
      servicePeriod: "01 May - 31 May 2026",
      duration: "30 Days",
      rate: 799.0,
      arrears: 200.0,
      amount: 999.0,
    },
  ],
  planAmount: 799.0,
  previousDues: 200.0,
  grandTotal: 999.0,
  amountInWords: "Nine Hundred Ninety-Nine Rupees Only",
  upiId: "sitaramcable@okicici",
  phones: ["+91 98765 43210", "+91 91234 56789"],
  shopAddress: "Shop No. 5, Main Market, Veraval, Gujarat - 362265",
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
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
  // Header
  header: {
    background: "#1a2e5a",
    color: "#ffffff",
    padding: "24px 36px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
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
    overflow: "hidden",
    flexShrink: 0,
  },
  logoSvg: { width: 72, height: 72 },
  companyName: { fontSize: 22, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2 },
  tagline: { fontSize: 11, color: "#a0b4d0", marginTop: 2 },
  contactInfo: { fontSize: 11, color: "#c8d8ee", marginTop: 8, lineHeight: 1.8 },
  headerBadge: {
    background: "#e8522a",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    padding: "6px 18px",
    borderRadius: 6,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  orangeBar: { height: 5, background: "linear-gradient(90deg,#e8522a,#f4a035)" },
  // Meta row
  metaRow: {
    display: "flex",
    borderBottom: "1px solid #e4e9f0",
    background: "#f8fafc",
  },
  metaCell: {
    flex: 1,
    padding: "14px 20px",
    borderRight: "1px solid #e4e9f0",
  },
  metaCellLast: { flex: 1, padding: "14px 20px" },
  metaLabel: { fontSize: 10, color: "#7a8fa6", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.6 },
  metaValue: { fontSize: 14, fontWeight: 700, color: "#1a2e5a", marginTop: 3 },
  statusUnpaid: {
    display: "inline-block",
    background: "#fff3e0",
    color: "#e65100",
    fontWeight: 800,
    fontSize: 13,
    padding: "3px 12px",
    borderRadius: 4,
    marginTop: 3,
    border: "1px solid #ffcc80",
  },
  statusPaid: {
    display: "inline-block",
    background: "#e8f5e9",
    color: "#1b5e20",
    fontWeight: 800,
    fontSize: 13,
    padding: "3px 12px",
    borderRadius: 4,
    marginTop: 3,
    border: "1px solid #a5d6a7",
  },
  // Body
  body: { padding: "20px 36px 28px" },
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
  addressText: { color: "#1a2e5a", fontWeight: 500, lineHeight: 1.7, fontSize: 12 },
  // Table
  table: { width: "100%", borderCollapse: "collapse" as const, marginBottom: 0 },
  thRow: { background: "#1a2e5a" },
  th: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    padding: "9px 12px",
    textAlign: "left" as const,
    letterSpacing: 0.5,
  },
  thRight: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 700,
    padding: "9px 12px",
    textAlign: "right" as const,
    letterSpacing: 0.5,
  },
  td: {
    padding: "10px 12px",
    fontSize: 12,
    color: "#1a2e5a",
    borderBottom: "1px solid #e4e9f0",
    textAlign: "left" as const,
  },
  tdRight: {
    padding: "10px 12px",
    fontSize: 12,
    color: "#1a2e5a",
    borderBottom: "1px solid #e4e9f0",
    textAlign: "right" as const,
  },
  tableWrapper: {
    border: "1px solid #dce4ef",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  // Totals
  totalsArea: { display: "flex", justifyContent: "flex-end", marginTop: 0 },
  totalsBox: { width: 280 },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    fontSize: 12,
    color: "#4a5568",
    borderBottom: "1px solid #eef1f6",
  },
  grandRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 800,
    color: "#ffffff",
    background: "#1a2e5a",
    borderRadius: "0 0 4px 4px",
  },
  wordsBox: {
    background: "#f0f4fa",
    border: "1px solid #dce4ef",
    borderRadius: 4,
    padding: "8px 14px",
    fontSize: 12,
    color: "#4a5568",
    fontStyle: "italic" as const,
    marginTop: 8,
    marginBottom: 16,
  },
  // Bottom
  bottomArea: { display: "flex", gap: 16, marginTop: 10 },
  payBox: { flex: 1 },
  payTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#e8522a",
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  payItem: { fontSize: 12, color: "#1a2e5a", marginBottom: 4, display: "flex", gap: 6 },
  payNum: { color: "#7a8fa6", fontWeight: 700, width: 18, flexShrink: 0 },
  qrBox: {
    width: 140,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #dce4ef",
    borderRadius: 4,
    padding: "10px 14px",
    background: "#f8fafc",
  },
  qrTitle: { fontSize: 10, fontWeight: 700, color: "#1a2e5a", letterSpacing: 0.5, marginBottom: 6 },
  qrPlaceholder: {
    width: 80,
    height: 80,
    background: "#e4e9f0",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    color: "#7a8fa6",
    textAlign: "center" as const,
    marginBottom: 6,
  },
  qrUpi: { fontSize: 10, color: "#1a2e5a", fontWeight: 600 },
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
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={styles.logoSvg}>
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
interface InvoicePDFProps {
  data?: Partial<InvoiceData>;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ data }) => {
  const d: InvoiceData = { ...DEFAULT_DATA, ...data };

  const statusStyle = d.status === "PAID" ? styles.statusPaid : styles.statusUnpaid;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoBox}><LogoSVG /></div>
          <div>
            <div style={styles.companyName}>SITARAM CABLE &amp; BROADBAND</div>
            <div style={styles.tagline}>Connecting Every Home</div>
            <div style={styles.contactInfo}>
              ☎ {d.phones[0]} &nbsp;|&nbsp; ☎ {d.phones[1]}<br />
              ■ {d.shopAddress}<br />
              WhatsApp Support: {d.phones[0]}<br />
              UPI: {d.upiId}
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
          <div style={styles.metaValue}>{d.invoiceNo}</div>
        </div>
        <div style={styles.metaCell}>
          <div style={styles.metaLabel}>Billing Date</div>
          <div style={styles.metaValue}>{d.billingDate}</div>
        </div>
        <div style={styles.metaCell}>
          <div style={styles.metaLabel}>Due Date</div>
          <div style={styles.metaValue}>{d.dueDate}</div>
        </div>
        <div style={styles.metaCellLast}>
          <div style={styles.metaLabel}>Status</div>
          <div style={statusStyle}>{d.status}</div>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Customer + Address */}
        <div style={styles.twoCol}>
          {/* Customer Info */}
          <div style={styles.infoBox}>
            <div style={styles.sectionTitle}>Customer Information</div>
            <div style={styles.infoContent}>
              {[
                ["Full Name", d.customer.fullName],
                ["Customer ID", d.customer.customerId],
                ["Mobile No", d.customer.mobile],
                ["Service Type", d.customer.serviceType],
                ["Device (ONU/MAC)", d.customer.deviceONU],
              ].map(([k, v]) => (
                <div style={styles.infoRow} key={k}>
                  <span style={styles.infoKey}>{k}:</span>
                  <span style={styles.infoVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Installation Address */}
          <div style={styles.infoBox}>
            <div style={styles.sectionTitle}>Installation Address</div>
            <div style={styles.infoContent}>
              <div style={styles.addressText}>
                {d.address.line1}<br />
                {d.address.line2}<br />
                {d.address.line3}
              </div>
              <div style={{ ...styles.infoRow, marginTop: 10 }}>
                <span style={styles.infoKey}>Area:</span>
                <span style={styles.infoVal}>{d.address.area}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoKey}>Tower:</span>
                <span style={styles.infoVal}>{d.address.tower}</span>
              </div>
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
                <th style={styles.th}>Duration</th>
                <th style={styles.thRight}>Rate (Rs.)</th>
                <th style={styles.thRight}>Arrears (Rs.)</th>
                <th style={styles.thRight}>Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {d.lineItems.map((item) => (
                <tr key={item.id} style={{ background: item.id % 2 === 0 ? "#f8fafc" : "#fff" }}>
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>{item.planName}</td>
                  <td style={styles.td}>{item.servicePeriod}</td>
                  <td style={styles.td}>{item.duration}</td>
                  <td style={styles.tdRight}>{item.rate.toFixed(2)}</td>
                  <td style={styles.tdRight}>{item.arrears.toFixed(2)}</td>
                  <td style={styles.tdRight}>{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={styles.totalsArea}>
          <div style={styles.totalsBox}>
            <div style={{ border: "1px solid #dce4ef", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
              <div style={styles.totalRow}>
                <span>Plan Amount:</span>
                <span>Rs. {d.planAmount.toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Previous Dues (Arrears):</span>
                <span>Rs. {d.previousDues.toFixed(2)}</span>
              </div>
            </div>
            <div style={styles.grandRow}>
              <span>GRAND TOTAL:</span>
              <span>Rs. {d.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div style={styles.wordsBox}>
          Amount in Words: <strong>{d.amountInWords}</strong>
        </div>

        {/* Payment Instructions + QR */}
        <div style={styles.bottomArea}>
          <div style={styles.payBox}>
            <div style={styles.payTitle}>Payment Instructions</div>
            {[
              `Pay via UPI: ${d.upiId}`,
              "GPay / PhonePe / Paytm accepted",
              "Cash payment at office also accepted",
              "Share screenshot after online payment",
              `Contact us for any billing queries`,
            ].map((txt, i) => (
              <div style={styles.payItem} key={i}>
                <span style={styles.payNum}>{i + 1}.</span>
                <span>{txt}</span>
              </div>
            ))}
            <div style={{ ...styles.payItem, marginTop: 4 }}>
              <span style={{ ...styles.payNum, width: "auto", marginLeft: 24 }}>Phone: {d.phones[0]}</span>
            </div>
          </div>
          <div style={styles.qrBox}>
            <div style={styles.qrTitle}>SCAN &amp; PAY</div>
            <div style={styles.qrPlaceholder}>QR<br />Code</div>
            <div style={styles.qrUpi}>UPI: {d.upiId}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Thank you for choosing Sitaram Cable &amp; Broadband &nbsp;|&nbsp; {d.upiId} &nbsp;|&nbsp; Support: {d.phones[0]}
      </div>
    </div>
  );
};

export default InvoicePDF;
