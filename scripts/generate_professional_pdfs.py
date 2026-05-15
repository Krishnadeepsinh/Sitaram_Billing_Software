import io
import os
import qrcode
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from PIL import Image

# --- Brand Colors (Refined) ---
NAVY = colors.HexColor("#1B2B4B")      # Primary Brand Color
NAVY_LIGHT = colors.HexColor("#243352") # Secondary / Box backgrounds
ORANGE = colors.HexColor("#F47920")    # Accent color
ORANGE_LIGHT = colors.HexColor("#FFF7ED")
ORANGE_BORDER = colors.HexColor("#FED7AA")
GREEN = colors.HexColor("#16A34A")     # Success color
GREEN_LIGHT = colors.HexColor("#DCFCE7")
RED = colors.HexColor("#DC2626")       # Due/Critical color
LIGHT_BG = colors.HexColor("#F4F7FB")  # Section background
BORDER = colors.HexColor("#DDE4EF")    # Subtle borders
DARK = colors.HexColor("#1E293B")      # Main text
GREY = colors.HexColor("#64748B")      # Secondary text
LABEL = colors.HexColor("#94A3B8")     # Form labels
WHITE = colors.HexColor("#FFFFFF")

# --- Constants ---
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 18*mm
CONTENT_WIDTH = PAGE_WIDTH - 2*MARGIN

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

# --- Helper Functions ---

def draw_rounded_rect(c, x, y, w, h, r, fill=None, stroke=None, sw=0.5):
    c.setLineWidth(sw)
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
    
    path = c.beginPath()
    path.moveTo(x + r, y)
    path.arcTo(x + w, y, x + w, y + h, r)
    path.arcTo(x + w, y + h, x, y + h, r)
    path.arcTo(x, y + h, x, y, r)
    path.arcTo(x, y, x + w, y, r)
    path.close()
    
    if fill and stroke:
        c.drawPath(path, fill=1, stroke=1)
    elif fill:
        c.drawPath(path, fill=1, stroke=0)
    elif stroke:
        c.drawPath(path, fill=0, stroke=1)

def draw_logo(c, x, y, size):
    logo_drawn = False
    for path in [LOGO_PATH, FALLBACK_LOGO]:
        if os.path.exists(path):
            try:
                img = ImageReader(path)
                c.drawImage(img, x, y, width=size, height=size, mask='auto', preserveAspectRatio=True)
                logo_drawn = True
                break
            except:
                continue
    if not logo_drawn:
        c.setFillColor(ORANGE)
        c.rect(x, y, size, size, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(x + size/2, y + size/2, "LOGO")

def draw_label_value(c, x, y, label, value, color=DARK, label_size=6.5, value_size=9):
    c.setFont("Helvetica", label_size)
    c.setFillColor(LABEL)
    c.drawString(x, y + 5*mm, label)
    
    c.setFont("Helvetica-Bold", value_size)
    c.setFillColor(color)
    c.drawString(x, y, value)

def make_qr_image(text):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=0)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B2B4B", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return ImageReader(img_byte_arr)

def draw_shared_header(c, title_text):
    # Header Band (Navy)
    c.setFillColor(NAVY)
    c.rect(0, PAGE_HEIGHT - 48*mm, PAGE_WIDTH, 48*mm, fill=1, stroke=0)
    
    # Accent Strips (Orange)
    c.setFillColor(ORANGE)
    c.rect(0, PAGE_HEIGHT - 2.5*mm, PAGE_WIDTH, 2.5*mm, fill=1, stroke=0) # Top
    c.rect(0, PAGE_HEIGHT - 48*mm, PAGE_WIDTH, 1.2*mm, fill=1, stroke=0) # Bottom
    
    # Logo & Name
    logo_size = 18*mm
    draw_logo(c, MARGIN, PAGE_HEIGHT - 35*mm, logo_size)
    
    text_x = MARGIN + logo_size + 5*mm
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(text_x, PAGE_HEIGHT - 18*mm, "SITARAM CABLE & BROADBAND")
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(text_x, PAGE_HEIGHT - 26*mm, "SITARAM CABLE & BROADBAND")
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 8)
    c.drawString(text_x, PAGE_HEIGHT - 32*mm, f"{DATA['CONTACT']}")
    
    # Right Badge
    box_w = 60*mm
    box_h = 32*mm
    box_x = PAGE_WIDTH - MARGIN - box_w
    box_y = PAGE_HEIGHT - 40*mm
    draw_rounded_rect(c, box_x, box_y, box_w, box_h, 4*mm, fill=NAVY_LIGHT)
    
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(box_x + box_w/2, box_y + 24*mm, "DOCUMENT TYPE")
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(box_x + box_w/2, box_y + 14*mm, title_text)
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 7)
    c.drawCentredString(box_x + box_w/2, box_y + 6*mm, DATA["TAGLINE"])

def draw_footer(c, text):
    footer_h = 10*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_WIDTH, footer_h, fill=1, stroke=0)
    
    c.setFillColor(ORANGE)
    c.rect(0, footer_h, PAGE_WIDTH, 1*mm, fill=1, stroke=0)
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 7)
    c.drawCentredString(PAGE_WIDTH/2, 4*mm, text)

# --- Generation Functions ---

def create_invoice():
    filename = os.path.join(r"c:\Projects\BROADBAND-BILLING", "Sitaram_Invoice_INV-2024-001.pdf")
    c = canvas.Canvas(filename, pagesize=A4)
    
    draw_shared_header(c, "TAX INVOICE")
    
    # 1. Meta Cards
    y = PAGE_HEIGHT - 48*mm - 20*mm
    card_w = (CONTENT_WIDTH - 9*mm) / 4
    card_h = 17*mm
    
    meta_data = [
        ("INVOICE NO.", "INV-2024-001"),
        ("BILLING DATE", DATA["BILLING_DATE"]),
        ("BILLING PERIOD", f"{DATA['PERIOD_START'].split()[1]} {DATA['PERIOD_START'].split()[2]}"),
        ("DUE DATE", DATA["DUE_DATE"])
    ]
    
    for i, (lbl, val) in enumerate(meta_data):
        x = MARGIN + i * (card_w + 3*mm)
        if i == 2: # Period highlight
            draw_rounded_rect(c, x, y, card_w, card_h, 4*mm, fill=NAVY)
            draw_label_value(c, x + 4*mm, y + 4*mm, lbl, val, color=WHITE)
        else:
            draw_rounded_rect(c, x, y, card_w, card_h, 4*mm, fill=LIGHT_BG, stroke=BORDER)
            draw_label_value(c, x + 4*mm, y + 4*mm, lbl, val, color=RED if i==3 else DARK)

    # 2. Connection Strip
    y -= 22*mm
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 14*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    draw_label_value(c, MARGIN + 6*mm, y + 4.5*mm, "CUSTOMER ID", DATA["CUSTOMER_ID"])
    draw_label_value(c, MARGIN + 65*mm, y + 4.5*mm, "SERVICE ADDRESS", f"{DATA['AREA_ZONE']} | {DATA['TOWER_ID']}")
    
    # Status Badge
    badge_w = 22*mm
    badge_h = 7*mm
    badge_x = PAGE_WIDTH - MARGIN - 6*mm - badge_w
    badge_y = y + 3.5*mm
    draw_rounded_rect(c, badge_x, badge_y, badge_w, badge_h, 3*mm, fill=colors.HexColor("#FEF2F2"), stroke=colors.HexColor("#FCA5A5"))
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#EF4444"))
    c.drawCentredString(badge_x + badge_w/2, badge_y + 2*mm, "● UNPAID")

    # 3. Billing Info (60/40)
    y -= 52*mm
    left_w = CONTENT_WIDTH * 0.62 - 2*mm
    right_w = CONTENT_WIDTH * 0.38 - 2*mm
    
    # Left: Customer Details
    draw_rounded_rect(c, MARGIN, y, left_w, 48*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(ORANGE)
    c.drawString(MARGIN + 6*mm, y + 40*mm, "BILLING TO")
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(DARK)
    c.drawString(MARGIN + 6*mm, y + 30*mm, DATA["CUSTOMER_NAME"])
    
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    c.drawString(MARGIN + 6*mm, y + 22*mm, DATA["ADDRESS_LINE_1"])
    c.drawString(MARGIN + 6*mm, y + 17*mm, DATA["ADDRESS_LINE_2"])
    c.drawString(MARGIN + 6*mm, y + 12*mm, f"{DATA['CITY']}, {DATA['STATE']} - {DATA['PINCODE']}")
    
    # Right: Summary Box
    draw_rounded_rect(c, MARGIN + left_w + 4*mm, y, right_w, 48*mm, 4*mm, fill=NAVY)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(MARGIN + left_w + 4*mm + right_w/2, y + 40*mm, "TOTAL AMOUNT DUE")
    
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(MARGIN + left_w + 4*mm + right_w/2, y + 18*mm, f"Rs. {DATA['GRAND_TOTAL']}")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawCentredString(MARGIN + left_w + 4*mm + right_w/2, y + 8*mm, f"Due by {DATA['DUE_DATE']}")

    # 4. Items Table
    y -= 15*mm
    c.setFillColor(NAVY)
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 10*mm, 4*mm, fill=NAVY)
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN + 6*mm, y + 3.5*mm, "DESCRIPTION")
    c.drawCentredString(MARGIN + 75*mm, y + 3.5*mm, "PERIOD")
    c.drawCentredString(MARGIN + 125*mm, y + 3.5*mm, "PLAN")
    c.drawRightString(PAGE_WIDTH - MARGIN - 6*mm, y + 3.5*mm, "TOTAL")
    
    y -= 14*mm
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 14*mm, 4*mm, fill=WHITE, stroke=BORDER)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 6*mm, y + 8*mm, DATA["PLAN_NAME"])
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)
    c.drawString(MARGIN + 6*mm, y + 4*mm, DATA["SERVICE_TYPE"])
    
    c.setFont("Helvetica", 9)
    c.setFillColor(DARK)
    c.drawCentredString(MARGIN + 75*mm, y + 6*mm, f"{DATA['PERIOD_START']} - {DATA['PERIOD_END']}")
    c.drawCentredString(MARGIN + 125*mm, y + 6*mm, f"Rs. {DATA['PLAN_AMOUNT']}")
    c.drawRightString(PAGE_WIDTH - MARGIN - 6*mm, y + 6*mm, f"Rs. {DATA['PLAN_AMOUNT']}.00")

    # 5. Payment Details & Totals
    y -= 52*mm
    # QR Card
    draw_rounded_rect(c, MARGIN, y, 45*mm, 48*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(MARGIN + 22.5*mm, y + 42*mm, "SCAN TO PAY")
    
    # QR Padding
    draw_rounded_rect(c, MARGIN + 6*mm, y + 9*mm, 33*mm, 31*mm, 3*mm, fill=WHITE)
    upi_link = f"upi://pay?pa={DATA['UPI_ID']}&pn=SITARAM+CABLE+BROADBAND&am={DATA['GRAND_TOTAL']}&cu=INR"
    qr_img = make_qr_image(upi_link)
    c.drawImage(qr_img, MARGIN + 7.5*mm, y + 10.5*mm, width=30*mm, height=30*mm)
    
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(MARGIN + 22.5*mm, y + 4*mm, DATA["UPI_ID"])
    
    # Totals Card
    tx = MARGIN + 49*mm
    tw = CONTENT_WIDTH - 49*mm
    draw_rounded_rect(c, tx, y, tw, 48*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(LABEL)
    c.drawString(tx + 6*mm, y + 40*mm, "BILLING SUMMARY")
    c.setStrokeColor(BORDER)
    c.line(tx + 6*mm, y + 38*mm, tx + tw - 6*mm, y + 38*mm)
    
    rows = [
        ("Current Plan Charges", f"Rs. {DATA['PLAN_AMOUNT']}.00"),
        ("Previous Outstanding", f"Rs. {DATA['ARREARS_AMOUNT']}.00"),
        ("Taxes (GST 0%)", "Rs. 0.00")
    ]
    ry = y + 32*mm
    for l, v in rows:
        c.setFont("Helvetica", 8.5)
        c.setFillColor(GREY)
        c.drawString(tx + 6*mm, ry, l)
        c.drawRightString(tx + tw - 6*mm, ry, v)
        ry -= 6*mm
        
    draw_rounded_rect(c, tx + 4*mm, y + 4*mm, tw - 8*mm, 10*mm, 3*mm, fill=NAVY)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(tx + 10*mm, y + 7.5*mm, "NET PAYABLE AMOUNT")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(tx + tw - 10*mm, y + 7.5*mm, f"Rs. {DATA['GRAND_TOTAL']}.00")

    # Amount in Words
    y -= 14*mm
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 11*mm, 4*mm, fill=ORANGE_LIGHT, stroke=ORANGE_BORDER)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(MARGIN + 6*mm, y + 6.5*mm, "AMOUNT IN WORDS")
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + 36*mm, y + 4*mm, DATA["AMOUNT_IN_WORDS"])
    
    # 6. Thank You Note
    y -= 25*mm
    c.setStrokeColor(ORANGE)
    c.setLineWidth(1)
    c.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(PAGE_WIDTH/2, y - 8*mm, "Thank You!")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_WIDTH/2, y - 13*mm, "WE APPRECIATE YOUR BUSINESS")

    draw_footer(c, "Computer Generated Invoice | No Signature Required")
    c.showPage()
    c.save()

def create_receipt():
    filename = os.path.join(r"c:\Projects\BROADBAND-BILLING", "Sitaram_Receipt_REC-10543.pdf")
    c = canvas.Canvas(filename, pagesize=A4)
    
    draw_shared_header(c, "PAYMENT RECEIPT")
    
    # 1. Meta Cards
    y = PAGE_HEIGHT - 48*mm - 20*mm
    card_w = (CONTENT_WIDTH - 9*mm) / 4
    card_h = 17*mm
    
    meta_data = [
        ("RECEIPT NO.", f"REC-{DATA['RECEIPT_NUMBER']}"),
        ("PAYMENT DATE", DATA["PAYMENT_DATE"]),
        ("METHOD", DATA["PAYMENT_METHOD"]),
        ("STATUS", "SUCCESS")
    ]
    
    for i, (lbl, val) in enumerate(meta_data):
        x = MARGIN + i * (card_w + 3*mm)
        if i == 3: # Success highlight
            draw_rounded_rect(c, x, y, card_w, card_h, 4*mm, fill=GREEN_LIGHT, stroke=GREEN)
            draw_label_value(c, x + 4*mm, y + 4*mm, lbl, val, color=GREEN)
        elif i == 2: # Method highlight
            draw_rounded_rect(c, x, y, card_w, card_h, 4*mm, fill=NAVY)
            draw_label_value(c, x + 4*mm, y + 4*mm, lbl, val, color=WHITE)
        else:
            draw_rounded_rect(c, x, y, card_w, card_h, 4*mm, fill=LIGHT_BG, stroke=BORDER)
            draw_label_value(c, x + 4*mm, y + 4*mm, lbl, val)

    # 2. Customer & Amount Paid (60/40)
    y -= 52*mm
    left_w = CONTENT_WIDTH * 0.62 - 2*mm
    right_w = CONTENT_WIDTH * 0.38 - 2*mm
    
    # Left Card
    draw_rounded_rect(c, MARGIN, y, left_w, 48*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(ORANGE)
    c.drawString(MARGIN + 6*mm, y + 40*mm, "RECEIVED FROM")
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(DARK)
    c.drawString(MARGIN + 6*mm, y + 30*mm, DATA["CUSTOMER_NAME"])
    
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    c.drawString(MARGIN + 6*mm, y + 22*mm, DATA["ADDRESS_LINE_1"])
    c.drawString(MARGIN + 6*mm, y + 17*mm, f"{DATA['CITY']}, {DATA['STATE']}")
    
    # Right Card (Big Amount)
    draw_rounded_rect(c, MARGIN + left_w + 4*mm, y, right_w, 48*mm, 4*mm, fill=NAVY)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(MARGIN + left_w + 4*mm + right_w/2, y + 40*mm, "TOTAL AMOUNT PAID")
    
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(MARGIN + left_w + 4*mm + right_w/2, y + 18*mm, f"Rs. {DATA['GRAND_TOTAL']}")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawCentredString(MARGIN + left_w + 4*mm + right_w/2, y + 8*mm, "PAYMENT CONFIRMED")

    # 3. Allocation Table
    y -= 15*mm
    c.setFillColor(NAVY)
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 10*mm, 4*mm, fill=NAVY)
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN + 6*mm, y + 3.5*mm, "ALLOCATION DETAILS")
    c.drawRightString(PAGE_WIDTH - MARGIN - 6*mm, y + 3.5*mm, "AMOUNT (Rs.)")
    
    y -= 14*mm
    items = [
        (f"Current Bill Payment ({DATA['PLAN_NAME']})", DATA["PLAN_AMOUNT"]),
        ("Previous Arrears Cleared", DATA["ARREARS_AMOUNT"]),
        ("Tax / Charges", 0)
    ]
    for lbl, val in items:
        draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 10*mm, 4*mm, fill=WHITE, stroke=BORDER)
        c.setFillColor(DARK)
        c.setFont("Helvetica", 9)
        c.drawString(MARGIN + 6*mm, y + 3.5*mm, lbl)
        c.drawRightString(PAGE_WIDTH - MARGIN - 6*mm, y + 3.5*mm, f"{val}.00")
        y -= 11*mm
    
    # 4. Final Confirmation
    y -= 15*mm
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 14*mm, 4*mm, fill=GREEN_LIGHT, stroke=GREEN)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 10*mm, y + 5*mm, "✔ ALL DUES CLEARED")
    c.drawRightString(PAGE_WIDTH - MARGIN - 10*mm, y + 5*mm, "BALANCE: Rs. 0.00")
    
    # Transaction Details
    y -= 35*mm
    draw_rounded_rect(c, MARGIN, y, CONTENT_WIDTH, 28*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(LABEL)
    c.drawString(MARGIN + 6*mm, y + 22*mm, "TRANSACTION INFORMATION")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(DARK)
    c.drawString(MARGIN + 6*mm, y + 14*mm, f"Transaction Ref: {DATA['UTR_NUMBER']}")
    c.drawString(MARGIN + 6*mm, y + 8*mm, f"Paid At: {DATA['PAYMENT_TIME']} | Date: {DATA['PAYMENT_DATE']}")
    
    # Verification Circle
    badge_x = PAGE_WIDTH - MARGIN - 40*mm
    badge_y = y + 2*mm
    c.setFillColor(GREEN)
    c.circle(badge_x + 20*mm, badge_y + 12*mm, 10*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(badge_x + 20*mm, badge_y + 11*mm, "VERIFIED")
    c.drawCentredString(badge_x + 20*mm, badge_y + 8*mm, "OK")

    draw_footer(c, "This is an electronically generated receipt and does not require a physical signature.")
    c.showPage()
    c.save()

if __name__ == "__main__":
    create_invoice()
    create_receipt()
    print("Professional PDFs (Design v2) generated successfully.")
