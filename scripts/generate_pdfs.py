import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
import qrcode
from PIL import Image

# BRAND COLORS
NAVY = colors.HexColor("#1B2B4B")
NAVY2 = colors.HexColor("#243352")
ORANGE = colors.HexColor("#F47920")
LIGHT_BG = colors.HexColor("#F4F7FB")
BORDER = colors.HexColor("#DDE4EF")
GREEN = colors.HexColor("#16A34A")
GREEN_BG = colors.HexColor("#DCFCE7")
RED_TEXT = colors.HexColor("#DC2626")
GREY = colors.HexColor("#64748B")
DARK = colors.HexColor("#1E293B")
LABEL = colors.HexColor("#94A3B8")
ORANGE_BG = colors.HexColor("#FFF7ED")
ORANGE_BD = colors.HexColor("#FED7AA")
WHITE = colors.HexColor("#FFFFFF")

# HELPER FUNCTIONS
def rrect(c, x, y, w, h, r, fill=False, stroke=False, sw=0.5):
    """rounded rect using manual beginPath()+arcTo()"""
    c.setLineWidth(sw)
    if fill:
        c.setFillColor(fill if isinstance(fill, colors.Color) else colors.white)
    if stroke:
        c.setStrokeColor(stroke if isinstance(stroke, colors.Color) else colors.black)
    
    path = c.beginPath()
    # Move to the start point (bottom left after the arc)
    path.moveTo(x + r, y)
    # Bottom right
    path.arcTo(x + w, y, x + w, y + h, r)
    # Top right
    path.arcTo(x + w, y + h, x, y + h, r)
    # Top left
    path.arcTo(x, y + h, x, y, r)
    # Bottom left
    path.arcTo(x, y, x + w, y, r)
    path.close()
    
    if fill and stroke:
        c.drawPath(path, fill=1, stroke=1)
    elif fill:
        c.drawPath(path, fill=1, stroke=0)
    elif stroke:
        c.drawPath(path, fill=0, stroke=1)

def make_qr_image(text):
    """generates QR with qrcode lib"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=0,
    )
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B2B4B", back_color="white")
    
    img_byte_arr = io.BytesIO()
    try:
        img.save(img_byte_arr, format='PNG')
    except TypeError:
        img.save(img_byte_arr)
    img_byte_arr.seek(0)
    return ImageReader(img_byte_arr)

def draw_logo(c, x, y, size):
    """loads logo and draws with mask='auto'"""
    # Fallback to public/logo-transparent.png if asked for logo doesn't exist
    logo_path = "sitaram_logo_512x512.png"
    if not os.path.exists(logo_path):
        # Check potential locations
        alt_paths = ["public/logo.png", "public/logo-transparent.png", "public/logo-mark.png"]
        for p in alt_paths:
            if os.path.exists(p):
                logo_path = p
                break
    
    if os.path.exists(logo_path):
        img = ImageReader(logo_path)
        c.drawImage(img, x, y, width=size, height=size, mask='auto')
    else:
        # Draw placeholder if logo not found
        c.setFillColor(ORANGE)
        c.rect(x, y, size, size, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 4)
        c.drawCentredString(x + size/2, y + size/2, "LOGO")

def hline(c, x1, x2, y, col, w):
    """horizontal rule"""
    c.setStrokeColor(col)
    c.setLineWidth(w)
    c.line(x1, y, x2, y)

def label_value(c, x, y, label_text, value_text, color=DARK):
    """LABEL-color 6.5pt label 5mm above DARK bold 9pt value"""
    c.setFont("Helvetica", 6.5)
    c.setFillColor(LABEL)
    c.drawString(x, y + 5*mm, label_text)
    
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(color)
    c.drawString(x, y, value_text)

def draw_shared_header(c, doc_type):
    width, height = A4
    # Full-width NAVY rect 48mm tall
    c.setFillColor(NAVY)
    c.rect(0, height - 48*mm, width, 48*mm, fill=1, stroke=0)
    
    # ORANGE strip 2.5mm at very top
    c.setFillColor(ORANGE)
    c.rect(0, height - 2.5*mm, width, 2.5*mm, fill=1, stroke=0)
    
    # ORANGE strip 1.2mm at bottom of header
    c.setFillColor(ORANGE)
    c.rect(0, height - 48*mm, width, 1.2*mm, fill=1, stroke=0)
    
    # LEFT: draw logo
    margin = 22*mm
    logo_size = 14*mm
    header_y = height - 48*mm
    logo_y = header_y + (48*mm - logo_size)/2
    draw_logo(c, margin, logo_y, logo_size)
    
    # Title text
    text_x = margin + logo_size + 4*mm
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(text_x, header_y + 28*mm, "SITARAM CABLE & BROADBAND")
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(text_x, header_y + 20*mm, "SITARAM CABLE & BROADBAND")
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 7.5)
    c.drawString(text_x, header_y + 14*mm, "Chitra, Bhavnagar 364004 | Support: 9825039825")
    
    # RIGHT: NAVY2 rounded box 55x36mm
    box_w = 55*mm
    box_h = 36*mm
    box_x = width - margin - box_w
    box_y = header_y + 6*mm
    rrect(c, box_x, box_y, box_w, box_h, 5*mm, fill=NAVY2, stroke=False)
    
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(box_x + box_w/2, box_y + 28*mm, "PAYMENT SUMMARY")
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(box_x + box_w/2, box_y + 20*mm, doc_type)
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 7)
    c.drawCentredString(box_x + box_w/2, box_y + 12*mm, "Chitra, Bhavnagar 364004")
    c.drawCentredString(box_x + box_w/2, box_y + 8*mm, "Support: 9825039825")

def generate_invoice(filename):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    margin = 22*mm
    content_width = width - 2*margin
    
    draw_shared_header(c, "Cable Bill")
    
    # SECTION 1 — FOUR META CARDS
    y_pos = height - 48*mm - 20*mm
    card_w = (content_width - 9*mm) / 4
    card_h = 17*mm
    
    labels = ["INVOICE NO.", "INVOICE DATE", "SERVICE WINDOW", "DUE DATE"]
    values = ["SCN-IN-752", "15-May-2026", "MAY-2026", "20-May-2026"]
    
    for i in range(4):
        x = margin + i * (card_w + 3*mm)
        if i == 2: # Highlighted card
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=NAVY, stroke=False)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            c.drawString(x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(WHITE)
            c.drawString(x + 3*mm, y_pos + 4*mm, values[i])
        else:
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=LIGHT_BG, stroke=BORDER)
            color = RED_TEXT if i == 3 else DARK
            label_value(c, x + 3*mm, y_pos + 4*mm, labels[i], values[i], color=color)

    # SECTION 2 — CONN ID STRIP
    y_pos -= 16*mm
    rrect(c, margin, y_pos, content_width, 13*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    label_value(c, margin + 5*mm, y_pos + 4*mm, "USER ID / CONN ID", "SITARAM_752")
    label_value(c, margin + 60*mm, y_pos + 4*mm, "PLAN PERIOD", "01-May to 31-May")
    
    # Paid badge
    badge_w = 20*mm
    badge_h = 6*mm
    badge_x = width - margin - 5*mm - badge_w
    badge_y = y_pos + 3.5*mm
    rrect(c, badge_x, badge_y, badge_w, badge_h, 3*mm, fill=GREEN_BG, stroke=GREEN, sw=0.5)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(GREEN)
    c.drawCentredString(badge_x + badge_w/2, badge_y + 1.5*mm, "● PAID")
    
    # SECTION 3 — CUSTOMER + PAYMENT STATUS (60/40)
    y_pos -= 46*mm
    left_w = content_width * 0.6 - 1.5*mm
    right_w = content_width * 0.4 - 1.5*mm
    
    # Left Card
    rrect(c, margin, y_pos, left_w, 43*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(ORANGE)
    c.drawString(margin + 5*mm, y_pos + 35*mm, "BILLED TO CUSTOMER")
    
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(margin + 5*mm, y_pos + 28*mm, "#12345")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(DARK)
    c.drawString(margin + 25*mm, y_pos + 28*mm, "Ajay Bhai Rathod")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    c.drawString(margin + 5*mm, y_pos + 22*mm, "Chitra Area, Near Hanuman Temple")
    c.drawString(margin + 5*mm, y_pos + 17*mm, "Bhavnagar, Gujarat")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawString(margin + 5*mm, y_pos + 8*mm, "STB:")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)
    c.drawString(margin + 12*mm, y_pos + 8*mm, "STB752001")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawString(margin + 40*mm, y_pos + 8*mm, "MOBILE:")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)
    c.drawString(margin + 55*mm, y_pos + 8*mm, "+91 9825039825")
    
    # Right Card
    rrect(c, margin + left_w + 3*mm, y_pos, right_w, 43*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 35*mm, "PAYMENT STATUS")
    
    badge_w = 30*mm
    badge_h = 12*mm
    badge_x = margin + left_w + 3*mm + (right_w - badge_w)/2
    rrect(c, badge_x, y_pos + 18*mm, badge_w, badge_h, 4*mm, fill=GREEN_BG, stroke=False)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(GREEN)
    c.drawCentredString(badge_x + badge_w/2, y_pos + 22*mm, "PAID")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 10*mm, "Due 20-May-2026")
    
    # SECTION 4 — SERVICE TABLE
    y_pos -= 15*mm
    c.setFillColor(NAVY)
    rrect(c, margin, y_pos, content_width, 9.5*mm, 4*mm, fill=NAVY, stroke=False)
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(margin + 5*mm, y_pos + 3.5*mm, "DESCRIPTION OF SERVICE")
    c.drawCentredString(margin + 75*mm, y_pos + 3.5*mm, "BILLING PERIOD")
    c.drawCentredString(margin + 120*mm, y_pos + 3.5*mm, "MONTHS")
    c.drawRightString(width - margin - 5*mm, y_pos + 3.5*mm, "PLAN PRICE")
    
    y_pos -= 13*mm
    rrect(c, margin, y_pos, content_width, 12*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin + 5*mm, y_pos + 6.5*mm, "POWER-PLUS [HIGH SPEED]")
    c.setFont("Helvetica", 7)
    c.setFillColor(GREY)
    c.drawString(margin + 5*mm, y_pos + 2.5*mm, "Digital Cable TV Service")
    
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DARK)
    c.drawCentredString(margin + 75*mm, y_pos + 5*mm, "01 May - 31 May")
    c.drawCentredString(margin + 120*mm, y_pos + 5*mm, "1.0")
    
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(NAVY)
    c.drawRightString(width - margin - 5*mm, y_pos + 5*mm, "Rs. 450.00")
    
    # SECTION 5 — QR + TOTALS
    y_pos -= 50*mm
    # Left box (QR)
    rrect(c, margin, y_pos, 42*mm, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(margin + 21*mm, y_pos + 40*mm, "SCAN TO PAY (UPI)")
    
    # White padding for QR
    rrect(c, margin + 5*mm, y_pos + 8*mm, 32*mm, 30*mm, 3*mm, fill=WHITE, stroke=False)
    qr_img = make_qr_image("upi://pay?pa=sitaram@upi&pn=Sitaram&am=450&cu=INR")
    c.drawImage(qr_img, margin + 6*mm, y_pos + 9*mm, width=30*mm, height=30*mm)
    
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(margin + 21*mm, y_pos + 3*mm, "sitaram@upi")
    
    # Right box (Totals)
    right_x = margin + 45*mm
    right_w = content_width - 45*mm
    rrect(c, right_x, y_pos, right_w, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(right_x + 5*mm, y_pos + 40*mm, "INVOICE SUMMARY")
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, y_pos + 38*mm, BORDER, 0.5)
    
    # Rows
    row_y = y_pos + 32*mm
    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawString(right_x + 5*mm, row_y, "Invoice Amount")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 450.00")
    
    row_y -= 5*mm
    c.drawString(right_x + 5*mm, row_y, "Discount")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 0.00")
    
    row_y -= 5*mm
    c.drawString(right_x + 5*mm, row_y, "GST (0%)")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 0.00")
    
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, row_y - 3*mm, BORDER, 0.5)
    
    # Highlight row
    rrect(c, right_x + 3*mm, y_pos + 3*mm, right_w - 6*mm, 10*mm, 3*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(right_x + 8*mm, y_pos + 6.5*mm, "FINAL AMOUNT PAYABLE")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(right_x + right_w - 8*mm, y_pos + 6.5*mm, "Rs. 450.00")
    
    # SECTION 6 — AMOUNT IN WORDS
    y_pos -= 14*mm
    rrect(c, margin, y_pos, content_width, 11*mm, 4*mm, fill=ORANGE_BG, stroke=ORANGE_BD)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(margin + 5*mm, y_pos + 6.5*mm, "AMOUNT IN WORDS")
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(margin + 35*mm, y_pos + 4*mm, "Four Hundred Fifty Rupees Only")
    
    # SECTION 7 — RECEIPT HISTORY
    y_pos -= 10*mm
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(margin, y_pos, "RECENT RECEIPT HISTORY")
    hline(c, margin, margin + 50*mm, y_pos - 2*mm, ORANGE, 1)
    
    y_pos -= 15*mm
    hist_w = content_width * 0.58
    rrect(c, margin, y_pos, hist_w, 11*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(margin + 5*mm, y_pos + 6*mm, "15-Apr-2026")
    c.setFont("Helvetica", 7)
    c.setFillColor(GREY)
    c.drawString(margin + 5*mm, y_pos + 2.5*mm, "Method: Cash Payment")
    
    # Badge right side
    rrect(c, margin + hist_w - 25*mm, y_pos + 2.5*mm, 20*mm, 6*mm, 3*mm, fill=GREEN_BG, stroke=False)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(GREEN)
    c.drawCentredString(margin + hist_w - 15*mm, y_pos + 4.5*mm, "Rs. 450")
    
    # SECTION 8 — THANK YOU
    y_pos -= 15*mm
    hline(c, margin, width - margin, y_pos, ORANGE, 1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, y_pos - 6*mm, "Thank You!")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(width/2, y_pos - 10*mm, "FOR CHOOSING SITARAM CABLE & BROADBAND")
    
    # SECTION 9 — FOOTER
    footer_h = 9*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, width, footer_h, fill=1, stroke=0)
    hline(c, 0, width, footer_h, ORANGE, 1.2*mm)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(width/2, 3*mm, "THIS IS A SYSTEM GENERATED INVOICE")
    
    c.save()

def generate_receipt(filename):
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    margin = 22*mm
    content_width = width - 2*margin
    
    draw_shared_header(c, "Payment Receipt")
    
    # SECTION 1 — FOUR META CARDS
    y_pos = height - 48*mm - 20*mm
    card_w = (content_width - 9*mm) / 4
    card_h = 17*mm
    
    labels = ["RECEIPT NO", "PAYMENT DATE", "METHOD", "STATUS"]
    values = ["PAY-612", "15-May-2026", "CASH", "SUCCESS"]
    
    for i in range(4):
        x = margin + i * (card_w + 3*mm)
        if i == 2: # Method highlighted
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=NAVY, stroke=False)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            c.drawString(x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(WHITE)
            c.drawString(x + 3*mm, y_pos + 4*mm, values[i])
        elif i == 3: # Status highlighted
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=GREEN_BG, stroke=GREEN, sw=0.5)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            c.drawString(x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(GREEN)
            c.drawString(x + 3*mm, y_pos + 4*mm, values[i])
        else:
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=LIGHT_BG, stroke=BORDER)
            label_value(c, x + 3*mm, y_pos + 4*mm, labels[i], values[i])

    # SECTION 2 — CUSTOMER + TOTAL PAID (60/40)
    y_pos -= 49*mm
    left_w = content_width * 0.6 - 1.5*mm
    right_w = content_width * 0.4 - 1.5*mm
    
    # Left Card (Customer)
    rrect(c, margin, y_pos, left_w, 46*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(ORANGE)
    c.drawString(margin + 5*mm, y_pos + 38*mm, "BILLED TO CUSTOMER")
    
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(margin + 5*mm, y_pos + 31*mm, "#12345")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(DARK)
    c.drawString(margin + 25*mm, y_pos + 31*mm, "Ajay Bhai Rathod")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    c.drawString(margin + 5*mm, y_pos + 25*mm, "Chitra Area, Near Hanuman Temple")
    c.drawString(margin + 5*mm, y_pos + 20*mm, "Bhavnagar, Gujarat")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawString(margin + 5*mm, y_pos + 10*mm, "STB:")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)
    c.drawString(margin + 12*mm, y_pos + 10*mm, "STB752001")
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawString(margin + 40*mm, y_pos + 10*mm, "MOBILE:")
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(DARK)
    c.drawString(margin + 55*mm, y_pos + 10*mm, "+91 9825039825")
    
    # Right Card (Total Paid)
    rrect(c, margin + left_w + 3*mm, y_pos, right_w, 46*mm, 4*mm, fill=NAVY, stroke=False)
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 38*mm, "TOTAL PAID")
    hline(c, margin + left_w + 8*mm, margin + content_width - 5*mm, y_pos + 36*mm, WHITE, 0.5)
    
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(WHITE)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 15*mm, "Rs. 450")
    
    c.setFont("Helvetica", 6.5)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 8*mm, "NET RECEIVED")
    
    # SECTION 3 — SERVICE TABLE
    y_pos -= 15*mm
    c.setFillColor(NAVY)
    rrect(c, margin, y_pos, content_width, 9.5*mm, 4*mm, fill=NAVY, stroke=False)
    
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(margin + 5*mm, y_pos + 3.5*mm, "SERVICE DESCRIPTION")
    c.drawCentredString(margin + 75*mm, y_pos + 3.5*mm, "SERVICE PERIOD")
    c.drawCentredString(margin + 120*mm, y_pos + 3.5*mm, "QTY")
    c.drawRightString(width - margin - 5*mm, y_pos + 3.5*mm, "AMOUNT")
    
    y_pos -= 13*mm
    rrect(c, margin, y_pos, content_width, 12*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin + 5*mm, y_pos + 6.5*mm, "POWER-PLUS [HIGH SPEED]")
    c.setFont("Helvetica", 7)
    c.setFillColor(GREY)
    c.drawString(margin + 5*mm, y_pos + 2.5*mm, "Digital Cable TV Service")
    
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DARK)
    c.drawCentredString(margin + 75*mm, y_pos + 5*mm, "01 May - 31 May")
    c.drawCentredString(margin + 120*mm, y_pos + 5*mm, "1")
    
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(NAVY)
    c.drawRightString(width - margin - 5*mm, y_pos + 5*mm, "Rs. 450.00")
    
    # SECTION 4 — TOTALS BOX
    y_pos -= 40*mm
    right_w = content_width * 0.45
    right_x = width - margin - right_w
    rrect(c, right_x, y_pos, right_w, 35*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(right_x + 5*mm, y_pos + 30*mm, "PAYMENT BREAKDOWN")
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, y_pos + 28*mm, BORDER, 0.5)
    
    row_y = y_pos + 22*mm
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(DARK)
    c.drawString(right_x + 5*mm, row_y, "Subtotal")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 450.00")
    
    row_y -= 6*mm
    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawString(right_x + 5*mm, row_y, "Discount")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 0.00")
    
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, row_y - 4*mm, BORDER, 0.5)
    
    # Net received row
    rrect(c, right_x + 3*mm, y_pos + 3*mm, right_w - 6*mm, 9*mm, 3*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(right_x + 8*mm, y_pos + 6*mm, "NET RECEIVED")
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(right_x + right_w - 8*mm, y_pos + 6*mm, "Rs. 450.00")
    
    # SECTION 5 — PAYMENT CONFIRMED
    y_pos -= 15*mm
    hline(c, margin, width - margin, y_pos, ORANGE, 1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, y_pos - 8*mm, "Payment Confirmed")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(width/2, y_pos - 13*mm, "AUTHORIZED DIGITAL RECEIPT")
    hline(c, margin, width - margin, y_pos - 18*mm, ORANGE, 1)
    
    # SECTION 6 — FOOTER
    footer_h = 9*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, width, footer_h, fill=1, stroke=0)
    hline(c, 0, width, footer_h, ORANGE, 1.2*mm)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(width/2, 3*mm, "THIS IS A SYSTEM GENERATED RECEIPT")
    
    c.save()

if __name__ == "__main__":
    generate_invoice("Invoice_SCN-IN-752.pdf")
    generate_receipt("Receipt_PAY-612.pdf")
    print("PDFs generated successfully: Invoice_SCN-IN-752.pdf, Receipt_PAY-612.pdf")
