import os
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

# --- Constants & Configuration ---
BLUE = HexColor("#1A3F8F")
ORANGE = HexColor("#F47920")
GREEN = HexColor("#27AE60")
DARK_GREEN = HexColor("#1E8449")
LIGHT_BLUE = HexColor("#E8EFF9")
LIGHT_GRAY = HexColor("#F5F5F5")
WHITE = HexColor("#FFFFFF")
BLACK = HexColor("#000000")

PAGE_WIDTH, PAGE_HEIGHT = A4

# --- Data ---
DATA = {
    "CUSTOMER_NAME": "Ramesh Kumar Patel",
    "CUSTOMER_ID": "SCB-2024-0042",
    "MOBILE_NUMBER": "+91 98001 23456",
    "SERVICE_TYPE": "Broadband - Fiber",
    "ONU_MAC": "SNB-4F:2A:91:BC:D0:11",
    "ADDRESS_LINE_1": "House No. 12, Patel Colony",
    "ADDRESS_LINE_2": "Near Ram Mandir, Station Road",
    "CITY": "Veraval",
    "STATE": "Gujarat",
    "PINCODE": "362265",
    "AREA_ZONE": "Zone-B",
    "TOWER_ID": "VRW-02",
    "PLAN_NAME": "60 Mbps Unlimited",
    "PERIOD_START": "01 May 2026",
    "PERIOD_END": "31 May 2026",
    "PLAN_AMOUNT": 799,
    "ARREARS_AMOUNT": 200,
    "GRAND_TOTAL": 999,
    "BILLING_DATE": "01 May 2026",
    "DUE_DATE": "10 May 2026",
    "RECEIPT_NUMBER": "10543",
    "PAYMENT_DATE": "01 May 2026",
    "PAYMENT_TIME": "04:32 PM",
    "UTR_NUMBER": "UTR123456789012",
    "PAYMENT_METHOD": "UPI / GPay",
    "AMOUNT_IN_WORDS": "Nine Hundred Ninety Nine Rupees Only",
    "UPI_ID": "sitaramcable@okicici",
    "COMPANY_NAME": "SITARAM CABLE & BROADBAND",
    "TAGLINE": "Connecting Every Home",
    "CONTACT": "+91 98765 43210 | Veraval, Gujarat",
}

# Paths
LOGO_PATH = r"c:\Projects\BROADBAND-BILLING\public\logo-transparent.png"
FALLBACK_LOGO = r"c:\Projects\BROADBAND-BILLING\public\logo.jpg"
OUTPUT_DIR = r"c:\Projects\BROADBAND-BILLING"

def generate_qr(data_str, filename):
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    return filename

def draw_header(c, title, y_pos):
    # Blue Band
    c.setFillColor(BLUE)
    c.rect(0, y_pos - 32*mm, PAGE_WIDTH, 32*mm, fill=1, stroke=0)
    
    # Orange Strip
    c.setFillColor(ORANGE)
    c.rect(0, y_pos - 35*mm, PAGE_WIDTH, 3*mm, fill=1, stroke=0)
    
    # Logo
    logo_drawn = False
    for path in [LOGO_PATH, FALLBACK_LOGO]:
        if os.path.exists(path):
            try:
                c.drawImage(path, 10*mm, y_pos - 28*mm, width=22*mm, height=22*mm, preserveAspectRatio=True, mask='auto')
                logo_drawn = True
                break
            except:
                continue
    
    if not logo_drawn:
        # Placeholder for Logo
        c.setFillColor(WHITE)
        c.rect(10*mm, y_pos - 28*mm, 22*mm, 22*mm, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(21*mm, y_pos - 18*mm, "LOGO")

    # Company Name & Tagline
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(38*mm, y_pos - 15*mm, DATA["COMPANY_NAME"])
    c.setFont("Helvetica", 9)
    c.drawString(38*mm, y_pos - 20*mm, DATA["TAGLINE"])
    
    # Contact Details in Header
    c.setFont("Helvetica", 8)
    contact_text = f"Phone: {DATA['CONTACT']} | UPI: {DATA['UPI_ID']}"
    c.drawRightString(PAGE_WIDTH - 10*mm, y_pos - 20*mm, contact_text)
    
    # Document Badge
    c.setFillColor(ORANGE if "INVOICE" in title else GREEN)
    c.rect(PAGE_WIDTH - 45*mm, y_pos - 12*mm, 35*mm, 8*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_WIDTH - 27.5*mm, y_pos - 6.5*mm, title)
    
    return y_pos - 35*mm

def draw_footer(c):
    c.setFillColor(BLUE)
    c.rect(0, 0, PAGE_WIDTH, 12*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 8)
    footer_text = f"Computer Generated Receipt - No Signature Required | {DATA['COMPANY_NAME']} | {DATA['CONTACT']}"
    c.drawCentredString(PAGE_WIDTH/2, 4.5*mm, footer_text)

def draw_meta_strip(c, items, y_pos):
    c.setFillColor(LIGHT_BLUE)
    c.rect(0, y_pos - 10*mm, PAGE_WIDTH, 10*mm, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 9)
    
    x = 15*mm
    for label, value in items:
        c.drawString(x, y_pos - 6.5*mm, f"{label}: {value}")
        x += (PAGE_WIDTH - 30*mm) / len(items)
        
    return y_pos - 10*mm

def draw_customer_info(c, y_pos, doc_type="INV"):
    y_start = y_pos - 5*mm
    
    # Left Column
    c.setFont("Helvetica-Bold", 10)
    c.drawString(15*mm, y_start - 5*mm, "CUSTOMER DETAILS")
    c.setFont("Helvetica", 9)
    c.drawString(15*mm, y_start - 12*mm, f"Name: {DATA['CUSTOMER_NAME']}")
    c.drawString(15*mm, y_start - 17*mm, f"ID: {DATA['CUSTOMER_ID']}")
    c.drawString(15*mm, y_start - 22*mm, f"Mobile: {DATA['MOBILE_NUMBER']}")
    c.drawString(15*mm, y_start - 27*mm, f"Service: {DATA['SERVICE_TYPE']}")
    if doc_type == "INV":
        c.drawString(15*mm, y_start - 32*mm, f"Device: {DATA['ONU_MAC']}")
    
    # Right Column
    c.setFont("Helvetica-Bold", 10)
    c.drawString(PAGE_WIDTH/2 + 5*mm, y_start - 5*mm, "INSTALLATION ADDRESS")
    c.setFont("Helvetica", 9)
    addr_y = y_start - 12*mm
    c.drawString(PAGE_WIDTH/2 + 5*mm, addr_y, DATA["ADDRESS_LINE_1"])
    c.drawString(PAGE_WIDTH/2 + 5*mm, addr_y - 5*mm, DATA["ADDRESS_LINE_2"])
    c.drawString(PAGE_WIDTH/2 + 5*mm, addr_y - 10*mm, f"{DATA['CITY']}, {DATA['STATE']} - {DATA['PINCODE']}")
    c.drawString(PAGE_WIDTH/2 + 5*mm, addr_y - 15*mm, f"Area: {DATA['AREA_ZONE']} | Tower: {DATA['TOWER_ID']}")
    
    return y_start - 45*mm

def create_invoice():
    filename = os.path.join(OUTPUT_DIR, "Sitaram_Invoice_INV-2024-001.pdf")
    c = canvas.Canvas(filename, pagesize=A4)
    y = PAGE_HEIGHT
    
    # Header
    y = draw_header(c, "TAX INVOICE", y)
    
    # Meta Strip
    meta_items = [
        ("Invoice No", "INV-2024-001"),
        ("Date", DATA["BILLING_DATE"]),
        ("Due Date", DATA["DUE_DATE"]),
        ("Status", "UNPAID")
    ]
    y = draw_meta_strip(c, meta_items, y)
    
    # Customer Info
    y = draw_customer_info(c, y, "INV")
    
    # Table Header
    y -= 5*mm
    c.setFillColor(LIGHT_GRAY)
    c.rect(10*mm, y - 8*mm, PAGE_WIDTH - 20*mm, 8*mm, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(12*mm, y - 5.5*mm, "#")
    c.drawString(20*mm, y - 5.5*mm, "Plan Name")
    c.drawString(60*mm, y - 5.5*mm, "Service Period")
    c.drawRightString(PAGE_WIDTH - 65*mm, y - 5.5*mm, "Plan (Rs.)")
    c.drawRightString(PAGE_WIDTH - 40*mm, y - 5.5*mm, "Arrears (Rs.)")
    c.drawRightString(PAGE_WIDTH - 15*mm, y - 5.5*mm, "Total (Rs.)")
    
    # Table Content
    y -= 8*mm
    c.setFont("Helvetica", 9)
    c.drawString(12*mm, y - 8*mm, "1")
    c.drawString(20*mm, y - 8*mm, DATA["PLAN_NAME"])
    c.drawString(60*mm, y - 8*mm, f"{DATA['PERIOD_START']} to {DATA['PERIOD_END']}")
    c.drawRightString(PAGE_WIDTH - 65*mm, y - 8*mm, f"{DATA['PLAN_AMOUNT']}.00")
    c.drawRightString(PAGE_WIDTH - 40*mm, y - 8*mm, f"{DATA['ARREARS_AMOUNT']}.00")
    c.drawRightString(PAGE_WIDTH - 15*mm, y - 8*mm, f"{DATA['GRAND_TOTAL']}.00")
    
    # Horizontal Line
    y -= 12*mm
    c.setStrokeColor(HexColor("#CCCCCC"))
    c.line(10*mm, y, PAGE_WIDTH - 10*mm, y)
    
    # Totals Section
    y -= 10*mm
    c.setFont("Helvetica", 10)
    c.drawRightString(PAGE_WIDTH - 50*mm, y, "Plan Amount:")
    c.drawRightString(PAGE_WIDTH - 15*mm, y, f"Rs. {DATA['PLAN_AMOUNT']}.00")
    y -= 6*mm
    c.drawRightString(PAGE_WIDTH - 50*mm, y, "Previous Arrears:")
    c.drawRightString(PAGE_WIDTH - 15*mm, y, f"Rs. {DATA['ARREARS_AMOUNT']}.00")
    
    y -= 10*mm
    c.setFillColor(BLUE)
    c.rect(PAGE_WIDTH - 85*mm, y - 8*mm, 75*mm, 10*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(PAGE_WIDTH - 80*mm, y - 1*mm, "GRAND TOTAL")
    c.drawRightString(PAGE_WIDTH - 15*mm, y - 1*mm, f"Rs. {DATA['GRAND_TOTAL']}.00")
    
    # Amount in Words
    y -= 18*mm
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(15*mm, y, f"Amount in Words: {DATA['AMOUNT_IN_WORDS']}")
    
    # QR Code & Payment Instructions
    y -= 35*mm
    upi_link = f"upi://pay?pa={DATA['UPI_ID']}&pn=SITARAM+CABLE+BROADBAND&am={DATA['GRAND_TOTAL']}&cu=INR"
    qr_file = generate_qr(upi_link, "invoice_qr.png")
    c.drawImage(qr_file, 15*mm, y, width=30*mm, height=30*mm)
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50*mm, y + 25*mm, "PAYMENT INSTRUCTIONS")
    c.setFont("Helvetica", 9)
    c.drawString(50*mm, y + 20*mm, "1. Scan the QR code using GPay, PhonePe, or Paytm.")
    c.drawString(50*mm, y + 15*mm, f"2. Verify payee: {DATA['COMPANY_NAME']}")
    c.drawString(50*mm, y + 10*mm, f"3. Pay exactly Rs. {DATA['GRAND_TOTAL']}.00 to avoid service disruption.")
    
    draw_footer(c)
    c.showPage()
    c.save()
    if os.path.exists("invoice_qr.png"): os.remove("invoice_qr.png")

def create_receipt():
    filename = os.path.join(OUTPUT_DIR, "Sitaram_Receipt_REC-10543.pdf")
    c = canvas.Canvas(filename, pagesize=A4)
    y = PAGE_HEIGHT
    
    # Header
    y = draw_header(c, "PAYMENT RECEIPT", y)
    
    # Meta Strip
    meta_items = [
        ("Receipt No", f"REC-{DATA['RECEIPT_NUMBER']}"),
        ("Date", DATA["PAYMENT_DATE"]),
        ("Ref Invoice", "INV-2024-001"),
        ("Status", "SUCCESS")
    ]
    y = draw_meta_strip(c, meta_items, y)
    
    # Customer Info
    y = draw_customer_info(c, y, "REC")
    
    # Receipt Table (Allocation)
    y -= 15*mm
    c.setFillColor(LIGHT_BLUE)
    c.rect(10*mm, y - 8*mm, PAGE_WIDTH - 20*mm, 8*mm, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(15*mm, y - 5.5*mm, "Allocation Summary")
    c.drawRightString(PAGE_WIDTH - 15*mm, y - 5.5*mm, "Amount (Rs.)")
    
    y -= 8*mm
    c.setFont("Helvetica", 10)
    items = [
        (f"Plan Charge ({DATA['PLAN_NAME']} May)", DATA["PLAN_AMOUNT"]),
        ("Previous Dues Cleared", DATA["ARREARS_AMOUNT"]),
        ("Total Amount Paid", DATA["GRAND_TOTAL"])
    ]
    
    for label, val in items:
        y -= 8*mm
        c.drawString(15*mm, y, label)
        c.drawRightString(PAGE_WIDTH - 15*mm, y, f"{val}.00")
    
    # Final Balance Line
    y -= 10*mm
    c.setFillColor(DARK_GREEN)
    c.rect(10*mm, y - 8*mm, PAGE_WIDTH - 20*mm, 8*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(15*mm, y - 5.5*mm, "REMAINING BALANCE")
    c.drawRightString(PAGE_WIDTH - 15*mm, y - 5.5*mm, "Rs. 0.00 (FULLY CLEARED)")
    
    # Payment Details Box
    y -= 25*mm
    c.setFillColor(LIGHT_GRAY)
    c.rect(15*mm, y - 25*mm, PAGE_WIDTH - 30*mm, 25*mm, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(20*mm, y - 5*mm, "TRANSACTION DETAILS")
    c.setFont("Helvetica", 9)
    c.drawString(20*mm, y - 12*mm, f"Payment Method: {DATA['PAYMENT_METHOD']}")
    c.drawString(20*mm, y - 17*mm, f"Transaction ID: {DATA['UTR_NUMBER']}")
    c.drawString(20*mm, y - 22*mm, f"Paid At: {DATA['PAYMENT_TIME']}")
    
    # Verified Badge
    y -= 55*mm
    cx = PAGE_WIDTH/2
    cy = y
    c.setFillColor(DARK_GREEN)
    c.circle(cx, cy, 18*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    # Draw checkmark
    c.setLineWidth(2)
    c.setStrokeColor(WHITE)
    c.line(cx - 7*mm, cy, cx - 2*mm, cy - 5*mm)
    c.line(cx - 2*mm, cy - 5*mm, cx + 8*mm, cy + 8*mm)
    
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(cx, cy - 9*mm, "VERIFIED")
    c.drawCentredString(cx, cy - 12*mm, "PAYMENT")
    c.drawCentredString(cx, cy - 15*mm, "CONFIRMED")
    
    draw_footer(c)
    c.showPage()
    c.save()

if __name__ == "__main__":
    create_invoice()
    create_receipt()
    print("PDFs generated successfully.")
