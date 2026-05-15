import io
import os
import json
from http.server import BaseHTTPRequestHandler
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
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return ImageReader(img_byte_arr)

def draw_logo(c, x, y, size):
    """loads logo and draws with mask='auto'"""
    # In Vercel, we might need to check multiple paths
    logo_path = "public/logo-transparent.png"
    if not os.path.exists(logo_path):
        logo_path = "logo-transparent.png" # Sometimes it's in the same dir
    
    if os.path.exists(logo_path):
        img = ImageReader(logo_path)
        c.drawImage(img, x, y, width=size, height=size, mask='auto')
    else:
        # Draw placeholder
        c.setFillColor(ORANGE)
        c.rect(x, y, size, size, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 4)
        c.drawCentredString(x + size/2, y + size/2, "SITARAM")

def hline(c, x1, x2, y, col, w):
    c.setStrokeColor(col)
    c.setLineWidth(w)
    c.line(x1, y, x2, y)

def label_value(c, x, y, label_text, value_text, color=DARK):
    c.setFont("Helvetica", 6.5)
    c.setFillColor(LABEL)
    c.drawString(x, y + 5*mm, label_text)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(color)
    c.drawString(x, y, value_text)

def draw_shared_header(c, doc_type, brand):
    width, height = A4
    c.setFillColor(NAVY)
    c.rect(0, height - 48*mm, width, 48*mm, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, height - 2.5*mm, width, 2.5*mm, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, height - 48*mm, width, 1.2*mm, fill=1, stroke=0)
    
    margin = 22*mm
    logo_size = 14*mm
    header_y = height - 48*mm
    logo_y = header_y + (48*mm - logo_size)/2
    draw_logo(c, margin, logo_y, logo_size)
    
    text_x = margin + logo_size + 4*mm
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(text_x, header_y + 28*mm, "SITARAM CABLE & BROADBAND")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(text_x, header_y + 20*mm, brand.get('name', 'SITARAM CABLE & BROADBAND'))
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 7.5)
    c.drawString(text_x, header_y + 14*mm, f"{brand.get('address', '')} | Support: {brand.get('phone', '')}")
    
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
    c.drawCentredString(box_x + box_w/2, box_y + 12*mm, brand.get('address', ''))
    c.drawCentredString(box_x + box_w/2, box_y + 8*mm, f"Support: {brand.get('phone', '')}")

def generate_invoice_pdf(buffer, data):
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 22*mm
    content_width = width - 2*margin
    brand = data.get('brand', {})
    
    draw_shared_header(c, "Cable Bill", brand)
    
    # SECTION 1 — FOUR META CARDS
    y_pos = height - 48*mm - 20*mm
    card_w = (content_width - 9*mm) / 4
    card_h = 17*mm
    
    labels = ["INVOICE NO.", "INVOICE DATE", "SERVICE WINDOW", "DUE DATE"]
    values = [
        data.get('number', 'N/A'),
        data.get('date', 'N/A'),
        data.get('billingPeriod', 'N/A'),
        data.get('dueDate', 'N/A')
    ]
    
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
    label_value(c, margin + 5*mm, y_pos + 4*mm, "USER ID / CONN ID", data.get('customerId', 'N/A'))
    label_value(c, margin + 60*mm, y_pos + 4*mm, "PLAN PERIOD", data.get('planPeriod', 'N/A'))
    
    # Status badge
    status = data.get('status', 'unpaid').upper()
    badge_w = 20*mm
    badge_h = 6*mm
    badge_x = width - margin - 5*mm - badge_w
    badge_y = y_pos + 3.5*mm
    badge_color = GREEN if status == 'PAID' else RED_TEXT
    badge_bg = GREEN_BG if status == 'PAID' else colors.HexColor("#FEE2E2")
    
    rrect(c, badge_x, badge_y, badge_w, badge_h, 3*mm, fill=badge_bg, stroke=badge_color, sw=0.5)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(badge_color)
    c.drawCentredString(badge_x + badge_w/2, badge_y + 1.5*mm, f"● {status}")
    
    # SECTION 3 — CUSTOMER + PAYMENT STATUS (60/40)
    y_pos -= 46*mm
    left_w = content_width * 0.6 - 1.5*mm
    right_w = content_width * 0.4 - 1.5*mm
    
    rrect(c, margin, y_pos, left_w, 43*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(ORANGE)
    c.drawString(margin + 5*mm, y_pos + 35*mm, "BILLED TO CUSTOMER")
    
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(margin + 5*mm, y_pos + 28*mm, f"#{data.get('customerNo', '-')}")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(DARK)
    c.drawString(margin + 25*mm, y_pos + 28*mm, data.get('customerName', 'N/A'))
    
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    addr = data.get('customerAddress', 'N/A').split('\n')
    c.drawString(margin + 5*mm, y_pos + 22*mm, addr[0] if len(addr) > 0 else 'N/A')
    c.drawString(margin + 5*mm, y_pos + 17*mm, addr[1] if len(addr) > 1 else '')
    
    # STB and Mobile - Dynamic display
    stb = str(data.get('stbNumber') or '').strip()
    if stb and stb != 'N/A':
        c.setFont("Helvetica", 7)
        c.setFillColor(LABEL)
        c.drawString(margin + 5*mm, y_pos + 8*mm, "STB:")
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(DARK)
        c.drawString(margin + 12*mm, y_pos + 8*mm, stb)
    
    mobile = str(data.get('customerMobile') or '').strip()
    if mobile and mobile != 'N/A':
        # Offset mobile if STB is present, otherwise put it at the start
        x_off = 40*mm if (stb and stb != 'N/A') else 5*mm
        c.setFont("Helvetica", 7)
        c.setFillColor(LABEL)
        c.drawString(margin + x_off, y_pos + 8*mm, "MOBILE:")
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(DARK)
        c.drawString(margin + x_off + 15*mm, y_pos + 8*mm, mobile)
    
    rrect(c, margin + left_w + 3*mm, y_pos, right_w, 43*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 35*mm, "PAYMENT STATUS")
    
    badge_w = 30*mm
    badge_h = 12*mm
    badge_x = margin + left_w + 3*mm + (right_w - badge_w)/2
    rrect(c, badge_x, y_pos + 18*mm, badge_w, badge_h, 4*mm, fill=badge_bg, stroke=False)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(badge_color)
    c.drawCentredString(badge_x + badge_w/2, y_pos + 22*mm, status)
    
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 10*mm, f"Due {data.get('dueDate', 'N/A')}")
    
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
    c.drawString(margin + 5*mm, y_pos + 6.5*mm, data.get('planName', 'N/A'))
    c.setFont("Helvetica", 7)
    c.setFillColor(GREY)
    service_type = "Digital Cable TV Service" if data.get('isCableMode', True) else "High-Speed Internet Service"
    c.drawString(margin + 5*mm, y_pos + 2.5*mm, service_type)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(DARK)
    c.drawCentredString(margin + 75*mm, y_pos + 5*mm, data.get('planPeriod', 'N/A'))
    c.drawCentredString(margin + 120*mm, y_pos + 5*mm, str(data.get('planMonths', '1.0')))
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(NAVY)
    c.drawRightString(width - margin - 5*mm, y_pos + 5*mm, f"Rs. {float(data.get('amount', 0)):.2f}")
    
    # SECTION 5 — QR + TOTALS
    y_pos -= 50*mm
    rrect(c, margin, y_pos, 42*mm, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(margin + 21*mm, y_pos + 40*mm, "SCAN TO PAY (UPI)")
    rrect(c, margin + 5*mm, y_pos + 8*mm, 32*mm, 30*mm, 3*mm, fill=WHITE, stroke=False)
    
    upi_url = f"upi://pay?pa={brand.get('upiId', 'sitaram@upi')}&pn=Sitaram&am={data.get('amount', 0)}&cu=INR"
    qr_img = make_qr_image(upi_url)
    c.drawImage(qr_img, margin + 6*mm, y_pos + 9*mm, width=30*mm, height=30*mm)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(margin + 21*mm, y_pos + 3*mm, brand.get('upiId', 'sitaram@upi'))
    
    right_x = margin + 45*mm
    right_w = content_width - 45*mm
    rrect(c, right_x, y_pos, right_w, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(LABEL)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(right_x + 5*mm, y_pos + 40*mm, "INVOICE SUMMARY")
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, y_pos + 38*mm, BORDER, 0.5)
    
    amt = float(data.get('amount', 0))
    row_y = y_pos + 32*mm
    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawString(right_x + 5*mm, row_y, "Invoice Amount")
    c.drawRightString(right_x + right_w - 5*mm, row_y, f"Rs. {amt:.2f}")
    row_y -= 5*mm
    c.drawString(right_x + 5*mm, row_y, "Discount")
    c.drawRightString(right_x + right_w - 5*mm, row_y, f"Rs. {float(data.get('discount', 0)):.2f}")
    row_y -= 5*mm
    c.drawString(right_x + 5*mm, row_y, "GST (0%)")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 0.00")
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, row_y - 3*mm, BORDER, 0.5)
    
    final_amt = amt - float(data.get('discount', 0))
    rrect(c, right_x + 3*mm, y_pos + 3*mm, right_w - 6*mm, 10*mm, 3*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(right_x + 8*mm, y_pos + 6.5*mm, "FINAL AMOUNT PAYABLE")
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(right_x + right_w - 8*mm, y_pos + 6.5*mm, f"Rs. {final_amt:.2f}")
    
    y_pos -= 14*mm
    rrect(c, margin, y_pos, content_width, 11*mm, 4*mm, fill=ORANGE_BG, stroke=ORANGE_BD)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(margin + 5*mm, y_pos + 6.5*mm, "AMOUNT IN WORDS")
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(margin + 35*mm, y_pos + 4*mm, data.get('amountInWords', 'N/A'))
    
    y_pos -= 10*mm
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(margin, y_pos, "RECENT RECEIPT HISTORY")
    hline(c, margin, margin + 50*mm, y_pos - 2*mm, ORANGE, 1)
    
    history = data.get('history', [])
    for h in history[:1]: # Show latest only
        y_pos -= 15*mm
        hist_w = content_width * 0.58
        rrect(c, margin, y_pos, hist_w, 11*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(margin + 5*mm, y_pos + 6*mm, h.get('date', 'N/A'))
        c.setFont("Helvetica", 7)
        c.setFillColor(GREY)
        c.drawString(margin + 5*mm, y_pos + 2.5*mm, f"Method: {h.get('method', 'N/A')}")
        rrect(c, margin + hist_w - 25*mm, y_pos + 2.5*mm, 20*mm, 6*mm, 3*mm, fill=GREEN_BG, stroke=False)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(GREEN)
        c.drawCentredString(margin + hist_w - 15*mm, y_pos + 4.5*mm, f"Rs. {h.get('amount', 0)}")
    
    y_pos = 40*mm
    hline(c, margin, width - margin, y_pos, ORANGE, 1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, y_pos - 6*mm, "Thank You!")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(width/2, y_pos - 10*mm, f"FOR CHOOSING {brand.get('name', 'SITARAM')}")
    
    footer_h = 9*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, width, footer_h, fill=1, stroke=0)
    hline(c, 0, width, footer_h, ORANGE, 1.2*mm)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(width/2, 3*mm, "THIS IS A SYSTEM GENERATED INVOICE")
    c.save()

def generate_receipt_pdf(buffer, data):
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 22*mm
    content_width = width - 2*margin
    brand = data.get('brand', {})
    
    draw_shared_header(c, "Payment Receipt", brand)
    
    # SECTION 1 — FOUR META CARDS
    y_pos = height - 48*mm - 20*mm
    card_w = (content_width - 9*mm) / 4
    card_h = 17*mm
    
    labels = ["RECEIPT NO", "PAYMENT DATE", "METHOD", "STATUS"]
    values = [
        data.get('number', 'N/A'),
        data.get('date', 'N/A'),
        data.get('method', 'N/A'),
        "SUCCESS"
    ]
    
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
    
    rrect(c, margin, y_pos, left_w, 46*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.drawString(margin + 5*mm, y_pos + 38*mm, "BILLED TO CUSTOMER")
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(margin + 5*mm, y_pos + 31*mm, f"#{data.get('customerNo', '-')}")
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(DARK)
    c.drawString(margin + 25*mm, y_pos + 31*mm, data.get('customerName', 'N/A'))
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    addr = data.get('customerAddress', 'N/A').split('\n')
    c.drawString(margin + 5*mm, y_pos + 25*mm, addr[0] if len(addr) > 0 else 'N/A')
    c.drawString(margin + 5*mm, y_pos + 20*mm, addr[1] if len(addr) > 1 else '')

    # CONDITIONAL STB/CUSTOMER ID
    stb_val = data.get('stbNumber')
    if stb_val and str(stb_val).strip().upper() not in ["N/A", "-", ""]:
        label = "STB" if data.get('isCableMode', True) else "ID"
        c.drawString(margin + 5*mm, y_pos + 14*mm, f"{label}: {stb_val}")
    
    # CONDITIONAL MOBILE
    mob_val = data.get('customerMobile')
    if mob_val and str(mob_val).strip().upper() not in ["N/A", "-", ""]:
        c.drawString(margin + 5*mm, y_pos + 10*mm, f"Mobile: {mob_val}")
    # Total Received Card (Right)
    
    rrect(c, margin + left_w + 3*mm, y_pos, right_w, 46*mm, 4*mm, fill=NAVY, stroke=False)
    c.setFont("Helvetica", 7)
    c.setFillColor(LABEL)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 38*mm, "TOTAL PAID")
    hline(c, margin + left_w + 8*mm, margin + content_width - 5*mm, y_pos + 36*mm, WHITE, 0.5)
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(WHITE)
    c.drawCentredString(margin + left_w + 3*mm + right_w/2, y_pos + 15*mm, f"Rs. {int(float(data.get('amount', 0)))}")
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
    
    items = data.get('items', [])
    for item in items:
        y_pos -= 13*mm
        rrect(c, margin, y_pos, content_width, 12*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin + 5*mm, y_pos + 6.5*mm, item.get('desc', 'N/A'))
        c.setFont("Helvetica", 7)
        c.setFillColor(GREY)
        c.drawString(margin + 5*mm, y_pos + 2.5*mm, item.get('subDesc', ''))
        c.setFont("Helvetica", 8.5)
        c.setFillColor(DARK)
        c.drawCentredString(margin + 75*mm, y_pos + 5*mm, item.get('period', 'N/A'))
        c.drawCentredString(margin + 120*mm, y_pos + 5*mm, str(item.get('qty', '1')))
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(NAVY)
        c.drawRightString(width - margin - 5*mm, y_pos + 5*mm, f"Rs. {float(item.get('total', 0)):.2f}")
    
    y_pos -= 40*mm
    right_w = content_width * 0.45
    right_x = width - margin - right_w
    rrect(c, right_x, y_pos, right_w, 35*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(LABEL)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(right_x + 5*mm, y_pos + 30*mm, "PAYMENT BREAKDOWN")
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, y_pos + 28*mm, BORDER, 0.5)
    
    amt = float(data.get('amount', 0))
    row_y = y_pos + 22*mm
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(DARK)
    c.drawString(right_x + 5*mm, row_y, "Subtotal")
    c.drawRightString(right_x + right_w - 5*mm, row_y, f"Rs. {amt:.2f}")
    row_y -= 6*mm
    c.setFont("Helvetica", 8)
    c.setFillColor(GREY)
    c.drawString(right_x + 5*mm, row_y, "Discount")
    c.drawRightString(right_x + right_w - 5*mm, row_y, "Rs. 0.00")
    hline(c, right_x + 5*mm, right_x + right_w - 5*mm, row_y - 4*mm, BORDER, 0.5)
    
    rrect(c, right_x + 3*mm, y_pos + 3*mm, right_w - 6*mm, 9*mm, 3*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(right_x + 8*mm, y_pos + 6*mm, "NET RECEIVED")
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(right_x + right_w - 8*mm, y_pos + 6*mm, f"Rs. {amt:.2f}")
    
    y_pos = 40*mm
    hline(c, margin, width - margin, y_pos, ORANGE, 1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, y_pos - 8*mm, "Payment Confirmed")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(width/2, y_pos - 13*mm, "AUTHORIZED DIGITAL RECEIPT")
    hline(c, margin, width - margin, y_pos - 18*mm, ORANGE, 1)
    
    footer_h = 9*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, width, footer_h, fill=1, stroke=0)
    hline(c, 0, width, footer_h, ORANGE, 1.2*mm)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 6.5)
    c.drawCentredString(width/2, 3*mm, "THIS IS A SYSTEM GENERATED RECEIPT")
    c.save()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        doc_type = data.get('type', 'invoice')
        buffer = io.BytesIO()
        
        if doc_type == 'invoice':
            generate_invoice_pdf(buffer, data)
            filename = f"Invoice_{data.get('number', 'INV')}.pdf"
        else:
            generate_receipt_pdf(buffer, data)
            filename = f"Receipt_{data.get('number', 'PAY')}.pdf"
            
        pdf_data = buffer.getvalue()
        buffer.close()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/pdf')
        self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.send_header('Content-Length', len(pdf_data))
        self.end_headers()
        self.wfile.write(pdf_data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
